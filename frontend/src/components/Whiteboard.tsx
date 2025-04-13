import { useEffect, useRef, useState } from 'react';
import { getBackendAPI } from '../utils/backendApi.tsx';
import { Checkpoint, RealtimeEvent, ResponseOutput, Status } from './Types';
import DetailedExplanationComponent from './whiteboard-elements/DetailedExplanation';
import ExplanationComponent from './whiteboard-elements/Explanation.tsx';
import MultipleChoice from './whiteboard-elements/MultipleChoice';
import OpenEndedQuestion from './whiteboard-elements/OpenendedQuestion';

type UIType = 'empty' | 'explanation' | 'multiple_choice' | 'buttons' | 'detailed_explanation' | 'openended_question';



const buildInstructions = ({ checkpoints, currentCheckpointIndex }: { checkpoints: Checkpoint[], currentCheckpointIndex: number }) => {
  let transcript = "";
  for (let i = 0; i <= currentCheckpointIndex; i++) {
    transcript += checkpoints[i].segment + " ";
    if (i < currentCheckpointIndex) {
      transcript += "\n[Previous Checkpoint]\nQuestion asked:" + checkpoints[i].question + "\n\n";
    }
  }
  transcript += "\n[Current Checkpoint]\nQuestion you should ask in this session:\n" + checkpoints[currentCheckpointIndex].question + "\n\n";
  console.log("Transcript sent to the model:")
  console.log(transcript);
  return `You sound very excited and enthusiastic. You are AI tutor that uses black board to help user learn from Youtube videos. You speak English only.
  Now the video has been paused at the indicated as [Current Checkpoint] checkpoint, and you are asking the user a question regarding the content before this checkpoint.
  First very concisely remind the user what the previous content was about, then ask the question. Make sure that you don't reveal the answer before the question.
  Keep in mind to use the tools to draw on the blackboard for visual aids. Every question must be acompanies by some visual (multiple choice or open ended question) on the blackboard.
  Once everything is done, ask the user if they want to go back to the video, and if they say yes, end the conversation with the end_conversation function. If you are ending the conversation, make sure to say good bye before actually running the function. DO NOT END the conversation without user's clear intent. Do not suggest to end the conversation before user answers your question.

  Do not have two consecutive backboard tools, always have some explanation in between.
Transcription:
  ${transcript}
  `;
}


export default function Whiteboard({ status, setStatus, conversationMode, setConversationMode, checkpoints, currentCheckpointIndex, setHermexIsAnimating, startPreloading, setStartPreloading }: { status: Status, setStatus: (status: Status) => void, conversationMode: boolean, setConversationMode: (conversationMode: boolean) => void, checkpoints: Checkpoint[], currentCheckpointIndex: number, setHermexIsAnimating: (hermexIsAnimating: boolean) => void, startPreloading: boolean, setStartPreloading: (startPreloading: boolean) => void }) {
  const [currentUI, setCurrentUI] = useState<UIType>('empty');

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [recentFunctionCallEvent, setRecentFunctionCallEvent] = useState<ResponseOutput | null>(null);
  const [sessionUpdated, setSessionUpdated] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);




  async function startSession() {
    // Get a session token for OpenAI Realtime API
    // const tokenResponse = await fetch("/token");
    // const data = await tokenResponse.json();
    const apiurl = await getBackendAPI();

    const payload = {
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: "verse",
      instructions: buildInstructions({ checkpoints, currentCheckpointIndex }),
      tools: [
        {
          type: "function",
          name: "display_explanation_text",
          description: 'Display explanation text to supplement your explanation. After running this, briefly explain what you just wrote on the board. Do not repeat the text you just wrote. It should be one short sentence.',
          parameters: {
            type: "object",
            strict: true,
            properties: {
              title: {
                type: "string",
                description: "The title of the explanation",
              },
              bullets: {
                type: "array",
                description: "3-4 bulletpoints to display",
                items: {
                  type: "string",
                },
              },
              notes: {
                type: "string",
                description: "Optionally, additional detailed notes to display",
              }
            },
            required: ["title", "bullets"],
          },
        },
        {
          type: "function",
          name: "display_openended_question",
          description: "Display an open ended question to the user. Run this before you ask the question.",
          parameters: {
            type: "object",
            strict: true,
            properties: {
              question: {
                type: "string",
                description: "The question text"
              }
            },
            required: ["question"]
          }
        },
        {
          type: "function",
          name: "display_multiple_choice",
          description: "Display multiple choice question. Run this before you ask the question.",
          parameters: {
            type: "object",
            strict: true,
            properties: {
              title: {
                type: "string",
                description: "The title of the quiz"
              },
              question: {
                type: "string",
                description: "The question text"
              },
              options: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "Array of possible answer options"
              },
              correctAnswer: {
                type: "string",
                description: "The correct answer option"
              }
            },
            required: ["title", "question", "options", "correctAnswer"]
          }
        },
        {
          type: "function",
          name: "end_conversation",
          description: "This will end the current conversation. Just briefly say goodbye to the user. (User will go back to the video)",
          parameters: {
            type: "object",
            strict: true,
            properties: {},
            required: []
          }
        }
      ],
      tool_choice: "auto",
      turn_detection: {
        type: "semantic_vad",
        eagerness: "low",
      }
    };
    const response = await fetch(`${apiurl}/session-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to get session token from backend");
    }

    const data = await response.json();
    console.log("Session token response:", data);

    if (!data.client_secret || !data.client_secret.value) {
      throw new Error("Missing client_secret in response");
    }

    const EPHEMERAL_KEY = data.client_secret.value;
    const pc = new RTCPeerConnection();

    // Set up to play remote audio from the model
    const audio = document.createElement("audio");
    audio.autoplay = true;
    audioElement.current = audio;
    pc.ontrack = (e) => {
      if (audioElement.current) {
        audioElement.current.srcObject = e.streams[0];
      }
    };

    // Add local audio track for microphone input in the browser
    const ms = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    pc.addTrack(ms.getTracks()[0]);

    // Set up data channel for sending and receiving events
    const dc = pc.createDataChannel("oai-events");
    setDataChannel(dc);

    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2024-12-17";
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    const answer: RTCSessionDescriptionInit = {
      type: 'answer',
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);

    peerConnection.current = pc;
  }

  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }

    peerConnection?.current?.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });

    if (peerConnection.current) {
      peerConnection.current.close();
    }

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
    setCurrentUI('empty');

    setEvents([]);
    setSessionUpdated(false);
  }

  // Send a message to the model
  function sendClientEvent(message: RealtimeEvent) {
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || crypto.randomUUID();
      // send event before setting timestamp since the backend peer doesn't expect this field
      dataChannel.send(JSON.stringify(message));
      console.log("message sending", message);

      // if guard just in case the timestamp exists by miracle
      if (!message.timestamp) {
        message.timestamp = timestamp;
      }

      setEvents((prev) => [message, ...prev]);
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }

  useEffect(() => {
    if (startPreloading) {
      setStartPreloading(false);
      startSession();
    }
  }, [startPreloading]);

  useEffect(() => {
    if (dataChannel) {
      // Append new server events to the list
      dataChannel.addEventListener("message", (e: MessageEvent) => {
        const event: RealtimeEvent = JSON.parse(e.data);
        if (!event.timestamp) {
          event.timestamp = new Date().toLocaleTimeString();
        }

        setEvents((prev) => [event, ...prev]);
      });

      // Set session active when the data channel is opened
      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
      });
    }
  }, [dataChannel]);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const firstEvent = events[events.length - 1];
    if (!sessionUpdated && firstEvent.type === "session.created") {

      //   sessionData.session.instructions = buildInstructions({ checkpoints, currentCheckpointIndex });

      //   sendClientEvent(sessionData);
      setTimeout(() => {
        sendClientEvent({
          type: "response.create",
          response: {
            // instructions: `Tell the user that you just interrupted the video for a surprise popup question! Then display the recap info about the video (look at the video transcript) on the blackboard.`,
            //tool_choice: "required",
          },
       });
      }, 5000);
      console.log("session created");
      setSessionUpdated(true);
      setConversationMode(true);
    }

    const mostRecentEvent = events[0];
    if (!mostRecentEvent.type.includes("delta")) {
      console.log(mostRecentEvent);
    }
    
    if (mostRecentEvent.type === "session.updated") {
      console.log("session updated");

    }
    if (mostRecentEvent.type === "output_audio_buffer.stopped") {
      setHermexIsAnimating(false);
    }
    if (mostRecentEvent.type === "response.audio_transcript.delta") {
      setHermexIsAnimating(true);
    }

    if (
      mostRecentEvent.type === "response.done" &&
      mostRecentEvent.response?.output
    ) {

      mostRecentEvent.response.output.forEach((output: any) => {
        if (output.type === "function_call") {

          switch (output.name) {
            case "display_explanation_text":
              if (output.arguments.notes) {
                setCurrentUI("detailed_explanation");
              } else {
                setCurrentUI("explanation");
              }
              setRecentFunctionCallEvent(output);
              // setTimeout(() => {
              //   sendClientEvent({
              //     type: "response.create",
              //     response: {
              //       instructions: `Briefly explain what you just wrote on the board.`,
              //     },
              //   });
              // }, 50);
              break;
            case "display_openended_question":
              setCurrentUI("openended_question");
              setRecentFunctionCallEvent(output);
              setTimeout(() => {
                sendClientEvent({
                  type: "response.create",
                  response: {
                    instructions: `Briefly explain what you just wrote on the board.`,
                  },
                });
              }, 50);
              break;
            case "display_multiple_choice":
              setCurrentUI("multiple_choice");
              setRecentFunctionCallEvent(output);
              setTimeout(() => {
                sendClientEvent({
                  type: "response.create",
                  response: {
                    instructions: `Briefly explain what you just wrote on the board.`,
                  },
                });
              }, 50);
              break;
            case "end_conversation":
              setTimeout(() => {
                stopSession();
                setConversationMode(false);
              }, 2000);
              break;
            default:
              setCurrentUI("empty");
              break;
          }

          //     type: "response.create",
          //     //   response: {
          //     //     instructions: `
          //     //     ask for feedback about the color palette - don't repeat 
          //     //     the colors, just ask if they like the colors.
          //     //   `,
          //     //   },
          //     event_id: "null",
          //   });



        }
      });
    }
  }, [events]);

  function handleEndChat() {
    setConversationMode(false);
  }

  const handleChoiceClick = (choice: string, call_id: string) => {
    sendClientEvent({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: call_id,
        output: `The user has selected ${choice} on the blackboard. `,
      }
    });
    sendClientEvent({
      type: "response.create",
      response: {
        instructions: `Give feedback about the user's choice.`,
      },
    });
  }

  function getUI() {

    switch (currentUI) {
      case "explanation":
        return <ExplanationComponent functionCallOutput={recentFunctionCallEvent!} />;
      case "detailed_explanation":
        return <DetailedExplanationComponent functionCallOutput={recentFunctionCallEvent!} />;
      case "multiple_choice":
        return <MultipleChoice functionCallOutput={recentFunctionCallEvent!} handleChoiceClick={handleChoiceClick} />;
      case "openended_question":
        return <OpenEndedQuestion functionCallOutput={recentFunctionCallEvent!} />;
      default:
        return <div>Checkpoint</div>;
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-[1050px] h-[600px]">
        {getUI()}
      </div>
    </div>
  );
};