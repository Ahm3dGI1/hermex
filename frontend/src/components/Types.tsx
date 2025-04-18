type Status = 'waitingForInput' | 'processing' | 'class' | 'review' | 'done';


type EventType = "response.done" | "session.update" | "session.created" | "response.create" | "session.updated" | "conversation.item.create" | "response.created" | "response.audio_transcript.delta" | "output_audio_buffer.stopped";

export interface Checkpoint {
  time: number;
  question: string;
  segment: string;
}

interface ConversationItemCreateEvent extends BaseEvent {
  type: "conversation.item.create";
  item: {
    type: "function_call_output" | "message" | "function_call";
    role?: "user" | "assistant" | "system";
    content?: Array<any>;
    call_id?: string;
    output?: string;
  };
}


interface ResponseOutput {
  type: "function_call" | "message" | "function_call_output";
  object: "realtime.item";
  id?: string;
  name?: string;
  arguments?: string;
  call_id?: string;
  content?: Array<any>;
  role?: "user" | "assistant" | "system";
  status?: "completed" | "incomplete";
  output?: string;
}


interface BaseEvent {
  event_id?: string;
  timestamp?: string;
  type: EventType;
}

interface ResponseDoneEvent extends BaseEvent {
  type: "response.done";
  response: {
    id: string;
    object: "realtime.response";
    status: string;
    status_details: string | null;
    output: ResponseOutput[];
    usage: {
      total_tokens: number;
      input_tokens: number;
      output_tokens: number;
      input_token_details: {
        cached_tokens: number;
        text_tokens: number;
        audio_tokens: number;
        cached_tokens_details: {
          text_tokens: number;
          audio_tokens: number;
        };
      };
      output_token_details: {
        text_tokens: number;
        audio_tokens: number;
      };
    };
  };
}

interface SessionUpdateEvent extends BaseEvent {
  type: "session.update";
  session: {
    modalities?: string[];
    instructions?: string;
    voice?: string;
    input_audio_format?: string;
    output_audio_format?: string;
    input_audio_transcription?: {
      model: string;
    };
    turn_detection?: {
      type: string;
      threshold: number;
      prefix_padding_ms: number;
      silence_duration_ms: number;
      create_response: boolean;
    };
    tools?: {
      type: string;
      name: string;
      description: string;
      parameters: any;
    }[];
    tool_choice?: string;
    temperature?: number;
    max_response_output_tokens?: string;
  };
}

interface SessionUpdatedEvent extends BaseEvent {
  type: "session.updated";
  session: {
    id: string;
    object: string;
  };
}

interface SessionCreatedEvent extends BaseEvent {
  type: "session.created";
  session: {
    id: string;
    object: string;
    model: string;
    modalities: string[];
    instructions: string;
    voice: string;
    input_audio_format: string;
    output_audio_format: string;
    input_audio_transcription: null;
    turn_detection: {
      type: string;
      threshold: number;
      prefix_padding_ms: number;
      silence_duration_ms: number;
    };
    tools: any[];
    tool_choice: string;
    temperature: number;
    max_response_output_tokens: string;
  };
}

interface ResponseCreateEvent extends BaseEvent {
  type: "response.create";
  response?: {
    instructions?: string;
    tool_choice?: any;
  };
}

interface ResponseCreatedEvent extends BaseEvent {
  type: "response.created";
  response?: {
    instructions?: string;
    tool_choice?: any;
    output?: ResponseOutput[];
  };
}

interface ResponseAudioTranscriptDeltaEvent extends BaseEvent {
  type: "response.audio_transcript.delta";
  // Define the expected shape of this event's data, or use any if unsure
  transcript?: string;
}

interface OutputAudioBufferStoppedEvent extends BaseEvent {
  type: "output_audio_buffer.stopped";
  // Define the expected shape of this event's data, or use any if unsure
  buffer?: string;
}


type RealtimeEvent = ResponseDoneEvent | SessionUpdateEvent | SessionCreatedEvent | ResponseCreateEvent | SessionUpdatedEvent | ConversationItemCreateEvent | ResponseCreatedEvent | ResponseAudioTranscriptDeltaEvent | OutputAudioBufferStoppedEvent;

export type { ConversationItemCreateEvent, RealtimeEvent, ResponseCreatedEvent, ResponseCreateEvent, ResponseDoneEvent, ResponseOutput, SessionCreatedEvent, SessionUpdateEvent, Status };

