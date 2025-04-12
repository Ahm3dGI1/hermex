import { useEffect, useRef, useState } from 'react';
import { Checkpoint, RealtimeEvent, ResponseOutput, SessionUpdateEvent, Status } from './Types';
import Explanation from './whiteboard-elements/Explanation';
import MultipleChoice from './whiteboard-elements/MultipleChoice';
import { getBackendAPI } from '../utils/backendApi.tsx';
type UIType = 'empty' | 'explanation' | 'multiple_choice' | 'buttons';

const buildInstructions = ({ checkpoints, currentCheckpointIndex }: { checkpoints: Checkpoint[], currentCheckpointIndex: number }) => {
  let transcript = "";
  for (let i = 0; i <= currentCheckpointIndex; i++) {
    transcript += checkpoints[i].segment + " ";
    if (i < currentCheckpointIndex) {
      transcript += "\n[Previous Checkpoint]\nQuestion asked:" + checkpoints[i].question + "\n\n";
    }
  }
  transcript += "\n[Current Checkpoint]\nQuestion you should ask in this session:" + checkpoints[currentCheckpointIndex].question + "\n\n";
  console.log("Transcript sent to the model:")
  console.log(transcript);
  return `
  You are AI tutor that uses black board to help user learn from Youtube videos.
  Now the video has been paused at the indicated as [Current Checkpoint] checkpoint, and you are asking the user a question regarding the content before this checkpoint.
  First very concisely remind the user what the previous content was about, then ask the question. Make sure that you don't reveal the answer before the question.
  Keep in mind to use the tools to draw on the blackboard for visual aids.
  Once everything is done, ask the user if they want to go back to the video, and if they say yes, end the conversation with the end_conversation function. If you are ending the conversation, make sure to say good bye before actually running the function. Do not end the conversation without user's clear intent.

Transcription:
  ${transcript}
  `;
}
const sessionData: SessionUpdateEvent = {
  type: "session.update",
  session: {
    instructions: "You are helpful assistant, that uses visual aids to explain things. You speak English.", // This must be updated based on the checkpoint
    tools: [
      {
        type: "function",
        name: "display_explanation_text",
        description: 'Display explanation text to supplement your explanation. Run this first before you start explaning.',
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
        description: "Display multiple choice question. Before running, very briefly tell the use that you are going to ask a question. After that run this function and then explain the question.",
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
  },
};


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
    const response = await fetch(`${apiurl}/session-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }

    if (peerConnection.current) {
      peerConnection.current.getSenders().forEach((sender: RTCRtpSender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      peerConnection.current.close();
    }

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  // Send a message to the model
  function sendClientEvent(message: RealtimeEvent) {
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || crypto.randomUUID();
      // send event before setting timestamp since the backend peer doesn't expect this field
      dataChannel.send(JSON.stringify(message));

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

      sessionData.session.instructions = buildInstructions({ checkpoints, currentCheckpointIndex });

      sendClientEvent(sessionData);
      console.log("session created");
      //   sendClientEvent({
      //     type: "response.create",
      //     response: {
      //       instructions: `Say hi..`,
      //     },
      //   });
      setSessionUpdated(true);
    }

    if (firstEvent.type === "session.updated") {
      console.log("session updated");
      sendClientEvent({
        type: "response.create",
      });
    }

    const mostRecentEvent = events[0];
    console.log(mostRecentEvent);
    if (
      mostRecentEvent.type === "response.done" &&
      mostRecentEvent.response?.output
    ) {

      mostRecentEvent.response.output.forEach((output: any) => {
        if (output.type === "function_call") {

          switch (output.name) {
            case "display_explanation_text":
              setCurrentUI("explanation");
              setTimeout(() => {
                sendClientEvent({
                  type: "response.create",
                });
              }, 20);
              break;
            case "display_multiple_choice":
              setCurrentUI("multiple_choice");
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
          setRecentFunctionCallEvent(output);
          //   sendClientEvent({
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
        return <div>Empty</div>;
    }
  }
  return (
    <div className='absolute bg-gray-200 w-2/3 z-10'>
      <h1>Whiteboard</h1>
      {conversationMode && (
        <div>
          <h1>Real time chat starting...</h1>
          <button onClick={handleEndChat}>End Chat</button>
        </div>
      )}
      {getUI()}
    </div>
  )
}
