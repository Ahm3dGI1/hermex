import { useEffect, useRef, useState } from "react";
import { RealtimeEvent, ResponseOutput } from "./Types";
import Explanation from "./whiteboard-elements/Explanation";
import MultipleChoice from "./whiteboard-elements/MultipleChoice";

type UITypes = "empty" | "explanation" | "multiple_choice";

const sessionData: RealtimeEvent = {
    type: "session.update",
    session: {
        instructions: "You are helpful assistant, that uses visual aids to explain things. You speak English.",
      tools: [
        {
          type: "function",
          name: "display_explanation_text",
          description: 'Display explanation text to supplement your explanation. Run this first before you start explaning',
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
        description: "Display multiple choice questions. Run this first before you start saying the questions.",
        parameters: {
          type: "object",
          strict: true,
          properties: {
            title: {
              type: "string", 
              description: "The title of the quiz section"
            },
            quizzes: {
              type: "array",
              items: {
                type: "object",
                properties: {
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
                required: ["question", "options", "correctAnswer"]
              }
            }
          },
          required: ["title", "quizzes"]
        }
      }
      ],
      tool_choice: "auto",
    },
  };

export default function RealtimeTest() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [recentFunctionCallEvent, setRecentFunctionCallEvent] = useState<ResponseOutput | null>(null);
  const [sessionUpdated, setSessionUpdated] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const [currentUI, setCurrentUI] = useState<UITypes>("empty");
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);

  async function startSession() {
    // Get a session token for OpenAI Realtime API
    // const tokenResponse = await fetch("/token");
    // const data = await tokenResponse.json();
    const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
    
    const response = await fetch(
        "https://api.openai.com/v1/realtime/sessions",
        {
        method: "POST",
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "gpt-4o-realtime-preview-2024-12-17",
            voice: "verse",
        }),
        },
    );

    const data = await response.json();
    console.log(data);
    
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
              break;
            case "display_multiple_choice":
              setCurrentUI("multiple_choice");
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
          
            setTimeout(() => {
              sendClientEvent({
                type: "response.create",
                // response: {
                //   instructions: `
                //   ask for feedback about the color palette - don't repeat 
                //   the colors, just ask if they like the colors.
                // `,
                // },
                event_id: "null",
              });
            }, 20);
          
        }
      });
    }
  }, [events]);

  function getUI() {
    switch (currentUI) {
      case "explanation":
        return <Explanation functionCallOutput={recentFunctionCallEvent!}/>;
      case "multiple_choice":
        return <MultipleChoice functionCallOutput={recentFunctionCallEvent!}/>;
      default:
        return <div>Empty</div>;
    }
  }

  return (
    <>
      <main className="absolute top-16 left-0 right-0 bottom-0">
          <div className="absolute top-4 left-4 flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isSessionActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">Session {isSessionActive ? 'Active' : 'Inactive'}</span>
          </div>
          {getUI()}
          <button className="absolute bottom-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-md" onClick={startSession}>start session</button>
          <button className="absolute bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md" onClick={stopSession}>stop session</button>
      </main>
    </>
  );
}
