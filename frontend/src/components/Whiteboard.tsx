import { useEffect, useRef, useState } from 'react';
import { getBackendAPI } from '../utils/backendApi.tsx';
import { Checkpoint, RealtimeEvent, ResponseOutput, Status } from './Types';
import Explanation from './whiteboard-elements/Explanation';
import MultipleChoice from './whiteboard-elements/MultipleChoice';
type UIType = 'empty' | 'explanation' | 'multiple_choice' | 'buttons';



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
  return `
  You are AI tutor that uses black board to help user learn from Youtube videos. You speak English only.
  Now the video has been paused at the indicated as [Current Checkpoint] checkpoint, and you are asking the user a question regarding the content before this checkpoint.
  First very concisely remind the user what the previous content was about, then ask the question. Make sure that you don't reveal the answer before the question.
  Keep in mind to use the tools to draw on the blackboard for visual aids.
  Once everything is done, ask the user if they want to go back to the video, and if they say yes, end the conversation with the end_conversation function. If you are ending the conversation, make sure to say good bye before actually running the function. Do not end the conversation without user's clear intent.

Transcription:
  ${transcript}
  `;
}

export default function Whiteboard({ status, setStatus, conversationMode, setConversationMode, checkpoints, currentCheckpointIndex }: { status: Status, setStatus: (status: Status) => void, conversationMode: boolean, setConversationMode: (conversationMode: boolean) => void, checkpoints: Checkpoint[], currentCheckpointIndex: number }) {
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
          description: 'Display explanation text to supplement your explanation. After running this, briefly explain what you just wrote on the board.',
          parameters: {
            type: "object",
            strict: true,
            properties: {
              title: {
                type: "string",
                description: "The title of the explanation",
              },
              text: {
                type: "string",
                description: "Very concise one sentence explanation to display",
              },
            },
            required: ["title", "text"],
          },
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

    // ✅ Add this check
    if (!data.client_secret || !data.client_secret.value) {
      throw new Error("Missing client_secret in response");
    }

    const EPHEMERAL_KEY = data.client_secret.value;
    // Create a peer connection
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

  //   function stopSession() {
  //     if (dataChannel) {
  //       dataChannel.close();
  //     }

  //     if (peerConnection.current) {
  //       peerConnection.current.getSenders().forEach((sender: RTCRtpSender) => {
  //         if (sender.track) {
  //           sender.track.stop();
  //         }
  //       });
  //       peerConnection.current.close();
  //     }

  //     setIsSessionActive(false);
  //     setDataChannel(null);
  //     peerConnection.current = null;
  //   }
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
      sendClientEvent({
        type: "response.create",
        response: {
          tool_choice: "required",
        },
      });

      console.log("session created");
      setSessionUpdated(true);
    }

    const mostRecentEvent = events[0];
    console.log(mostRecentEvent);
    if (mostRecentEvent.type === "session.updated") {
      console.log("session updated");
      // setTimeout(() => {
      //   sendClientEvent({
      //     type: "response.create",
      //     response: {
      //       instructions: `First very concisely remind the user what the previous content was about, then ask the question. Make sure that you don't reveal the answer before the question. Start speaking`,
      //     },
      //   });
      // }, 20);
    }

    if (
      mostRecentEvent.type === "response.done" &&
      mostRecentEvent.response?.output
    ) {

      mostRecentEvent.response.output.forEach((output: any) => {
        if (output.type === "function_call") {

          switch (output.name) {
            case "display_explanation_text":
              setCurrentUI("explanation");
              setRecentFunctionCallEvent(output);
              setTimeout(() => {
                sendClientEvent({
                  type: "response.create",
                });
              }, 20);
              break;
            case "display_multiple_choice":
              setCurrentUI("multiple_choice");
              setRecentFunctionCallEvent(output);
              setTimeout(() => {
                sendClientEvent({
                  type: "response.create",
                });
              }, 20);
              break;
            case "end_conversation":
              stopSession();
              setConversationMode(false);
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


  useEffect(() => {
    if (conversationMode) {
      console.log("Starting real time chat");
      startSession();
    }
  }, [conversationMode]);

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
        return <Explanation functionCallOutput={recentFunctionCallEvent!} />;
      case "multiple_choice":
        return <MultipleChoice functionCallOutput={recentFunctionCallEvent!} handleChoiceClick={handleChoiceClick} />;
      default:
        return <div>Checkpoint</div>;
    }
  }

  return (
    <div className="mx-auto mt-[100px] ml-[300px] w-[1050px] h-[600px]">
      {getUI()}
      {conversationMode && (
        <div className="flex mt-[500px] items-center justify-center gap-4 w-full">
          <button onClick={handleEndChat} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-48"
          >End Chat</button>
        </div>
      )}
    </div>
  );
};

