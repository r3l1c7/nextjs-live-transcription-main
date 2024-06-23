import { useEffect, useRef, useState } from "react";
import {
  LiveConnectionState,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
  useDeepgram,
} from "../context/DeepgramContextProvider";
import {
  MicrophoneEvents,
  MicrophoneState,
  useMicrophone,
} from "../context/MicrophoneContextProvider";
import Visualizer from "./Visualizer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import AudioPlayer from "./Audio"
import ButtonEffect from './Button';

const questions = [
  {
    id: 1,
    type: "text",
    question: "Name:",
  },
  {
    id: 2,
    type: "text",
    question: "Date of Birth:",
  },
  {
    id: 3,
    type: "text",
    question: "Age:",
  },
  {
    id: 4,
    type: "text",
    question: "Home Phone:",
  },
  {
    id: 5,
    type: "text",
    question: "Cell Phone:",
  },
  {
    id: 6,
    type: "text",
    question: "Home Address:",
  },
  {
    id: 7,
    type: "text",
    question: "City:",
  },
  {
    id: 8,
    type: "text",
    question: "State:",
  },
  {
    id: 9,
    type: "text",
    question: "Zip:",
  },
  {
    id: 10,
    type: "text",
    question: "E-Mail Address:",
  },
  {
    id: 11,
    type: "text",
    question: "Occupation:",
  },
  {
    id: 12,
    type: "radio",
    question: "May we contact you via Email or text?",
    options: ["Yes", "No"],
  },
  {
    id: 13,
    type: "text",
    question: "In Case of Emergency Contact:",
  },
  {
    id: 14,
    type: "text",
    question: "Relationship:",
  },
  {
    id: 15,
    type: "text",
    question: "Emergency Contact Home Phone:",
  },
  {
    id: 16,
    type: "text",
    question: "Emergency Contact Cell Phone:",
  },
  {
    id: 17,
    type: "text",
    question: "Emergency Contact Work Phone:",
  },
  {
    id: 18,
    type: "text",
    question: "Primary Care Physician’s Name:",
  },
  {
    id: 19,
    type: "text",
    question: "Primary Care Physician’s Phone:",
  },
  {
    id: 20,
    type: "text",
    question: "Who may we thank for referring you to our clinic?",
  },
  {
    id: 21,
    type: "radio",
    question: "How would you rate your overall health?",
    options: ["Excellent", "Good", "Fair", "Poor"],
  },
  {
    id: 22,
    type: "radio",
    question: "Do you have any allergies?",
    options: ["Yes", "No", "Not sure"],
  },
  {
    id: 23,
    type: "radio",
    question: "How often do you exercise?",
    options: ["Daily", "2-3 times a week", "Occasionally", "Rarely"],
  },
  {
    id: 24,
    type: "radio",
    question: "Do you drink alcohol?",
    options: ["Yes", "No"],
  },
  {
    id: 25,
    type: "radio",
    question: "Do you smoke?",
    options: ["Yes", "No"],
  },
  {
    id: 26,
    type: "radio",
    question: "Are you being treated by a Dermatologist?",
    options: ["Yes", "No"],
  },
  {
    id: 27,
    type: "radio",
    question: "Are you being treated for skin conditions on your face?",
    options: ["Yes", "No"],
  },
  {
    id: 28,
    type: "radio",
    question: "Are you taking Accutane or have you had Accutane within the last 6 months?",
    options: ["Yes", "No"],
  },
  {
    id: 29,
    type: "radio",
    question: "Do you get cold sores?",
    options: ["Yes", "No"],
  },
  {
    id: 30,
    type: "radio",
    question: "Do you get Keloid Scars?",
    options: ["Yes", "No"],
  },
  {
    id: 31,
    type: "radio",
    question: "Do you bruise easily?",
    options: ["Yes", "No"],
  },
  {
    id: 32,
    type: "radio",
    question: "Do you have any metal implants, IUDs, Screws, Vaginal/Bladder Mesh, etc?",
    options: ["Yes", "No"],
  },
];

class CustomTranscriptionHandler {
  private buffer: string[] = [];
  private lastTranscriptTime: number = 0;
  private readonly TIMEOUT_MS: number = 1500;
  private readonly PHONE_TIMEOUT_MS: number = 500; // Shorter timeout for phone numbers
  private readonly EMAIL_REGEX: RegExp = /\S+@\S+\.\S+/;
  private readonly PHONE_REGEX: RegExp = /(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}/;
  private readonly PARTIAL_PHONE_REGEX: RegExp = /\d{3}[-.\s]?\d{3}/; // Matches partial phone numbers

  handleTranscription(result: LiveTranscriptionEvent, currentQuestion: string): string | null {
    const transcript = result.channel.alternatives[0].transcript.trim();
    this.lastTranscriptTime = Date.now();

    // Filter out "confirm" from the transcript
    const filteredTranscript = transcript.replace(/\bconfirm\b/gi, '').trim();

    if (filteredTranscript !== '') {
      this.buffer.push(filteredTranscript);
    }

    const fullTranscript = this.buffer.join(' ').trim();

    const isPhoneQuestion = currentQuestion.toLowerCase().includes("phone");
    const containsEmail = this.EMAIL_REGEX.test(fullTranscript);
    const containsFullPhoneNumber = this.PHONE_REGEX.test(fullTranscript);
    const containsPartialPhoneNumber = this.PARTIAL_PHONE_REGEX.test(fullTranscript);
    const containsSubstantialContent = fullTranscript.split(' ').length >= 3 || fullTranscript.length > 15;

    const shouldFinalize = 
      containsEmail ||
      containsFullPhoneNumber ||
      (isPhoneQuestion && containsPartialPhoneNumber && Date.now() - this.lastTranscriptTime > this.PHONE_TIMEOUT_MS) ||
      containsSubstantialContent ||
      (result.is_final && result.speech_final) ||
      (Date.now() - this.lastTranscriptTime > this.TIMEOUT_MS);

    if (shouldFinalize) {
      return this.finalizeTranscript(currentQuestion);
    }

    return null;
  }

  private finalizeTranscript(currentQuestion: string): string | null {
    if (this.buffer.length > 0) {
      let result = this.buffer.join(' ').trim();
      
      if (currentQuestion.toLowerCase().includes("email")) {
        const emailMatch = result.match(this.EMAIL_REGEX);
        if (emailMatch) {
          result = emailMatch[0];
        }
      } else if (currentQuestion.toLowerCase().includes("phone")) {
        const phoneMatch = result.match(this.PHONE_REGEX);
        if (phoneMatch) {
          result = phoneMatch[0];
        } else {
          // If no full phone number is found, extract all number sequences
          const numberMatches = result.match(/\d+/g);
          if (numberMatches) {
            result = numberMatches.join('');
            // Format the number if it's 10 digits
            if (result.length === 10) {
              result = `(${result.slice(0,3)}) ${result.slice(3,6)}-${result.slice(6)}`;
            }
          }
        }
      }

      this.resetState();
      return result;
    }
    return null;
  }

  private resetState() {
    this.buffer = [];
    this.lastTranscriptTime = Date.now();
  }
}
const App: React.FC = () => {
  const [caption, setCaption] = useState<string | undefined>("Powered by Bubolo Care");
  const { connection, connectToDeepgram, connectionState } = useDeepgram();
  const { setupMicrophone, microphone, startMicrophone, microphoneState } = useMicrophone();
  const captionTimeout = useRef<any>();
  const keepAliveInterval = useRef<any>();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showQuiz, setShowQuiz] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isListeningForConfirmation, setIsListeningForConfirmation] = useState(false);
  const [transcriptionTimeout, setTranscriptionTimeout] = useState<NodeJS.Timeout | null>(null);
  const transcriptionHandler = useRef(new CustomTranscriptionHandler());
  const [showNavigationButtons, setShowNavigationButtons] = useState(false);
  const handleGoBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setInputValue(answers[currentQuestion - 1] || "");
      setIsListeningForConfirmation(false);
    }
  };
  
  useEffect(() => {
    setupMicrophone();
  }, []);

  useEffect(() => {
    if (microphoneState === MicrophoneState.Ready) {
      connectToDeepgram({
        model: "nova-2",
        interim_results: true,
        smart_format: true,
        filler_words: true,
        endpointing: 1150,
      });
    }
  }, [microphoneState]);

  useEffect(() => {
    if (!microphone) return;
    if (!connection) return;

    const onData = (e: BlobEvent) => {
      connection?.send(e.data);
    };

    const onTranscript = async (data: LiveTranscriptionEvent) => {
      const { is_final: isFinal, speech_final: speechFinal } = data;
      let thisCaption = data.channel.alternatives[0].transcript;
    
      console.log("thisCaption", thisCaption, "isFinal:", isFinal, "speechFinal:", speechFinal);
      
      if (thisCaption !== "") {
        setCaption(thisCaption);
    
        if (isListeningForConfirmation) {
          if (thisCaption.toLowerCase().includes("confirm")) {
            handleConfirm();
          } else if (thisCaption.toLowerCase().includes("try again")) {
            handleReject();
          }
        } else {
          const finalTranscript = transcriptionHandler.current.handleTranscription(data, questions[currentQuestion].question);
          if (finalTranscript) {
            console.log("Final transcript:", finalTranscript);
            
            // Validate and format the answer using the API
            const validationResult = await validateAnswer(questions[currentQuestion].question, finalTranscript);
            
            console.log("Validation result:", validationResult);
    
            // Update the input value with the validated and formatted answer or default to an empty string
            setInputValue(validationResult.answer || "");
    
            // Handle radio type questions
            if (questions[currentQuestion].type === "radio") {
              const currentOptions = questions[currentQuestion].options;
              if (currentOptions) {
                const matchedOption = currentOptions.find(option =>
                  validationResult.answer?.toLowerCase().includes(option.toLowerCase())
                );
    
                if (matchedOption) {
                  setAnswers(prev => ({ ...prev, [currentQuestion]: matchedOption }));
                }
              }
            }
    
            // Handle text type questions
            if (questions[currentQuestion].type === "text") {
              setAnswers(prev => ({ ...prev, [currentQuestion]: validationResult.answer || "" }));
            }
    
            // Clear any existing timeout
            if (transcriptionTimeout) {
              clearTimeout(transcriptionTimeout);
            }
    
            // Set a new timeout
            const newTimeout = setTimeout(() => {
              setIsListeningForConfirmation(true);
              setCaption("Say 'confirm' to proceed or 'try again' to re-record.");
            }, 2000); // Reduced wait time to 2 seconds
    
            setTranscriptionTimeout(newTimeout);
          }
        }
      }
    
      if (isFinal && speechFinal) {
        clearTimeout(captionTimeout.current);
        captionTimeout.current = setTimeout(() => {
          setCaption(undefined);
          clearTimeout(captionTimeout.current);
        }, 3000);
      }
    };

    if (connectionState === LiveConnectionState.OPEN) {
      connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
      microphone.addEventListener(MicrophoneEvents.DataAvailable, onData);

      startMicrophone();
    }
    return () => {
      connection.removeListener(LiveTranscriptionEvents.Transcript, onTranscript);
      microphone.removeEventListener(MicrophoneEvents.DataAvailable, onData);
      clearTimeout(captionTimeout.current);
      if (transcriptionTimeout) {
        clearTimeout(transcriptionTimeout);
      }
    };
  }, [connectionState, currentQuestion, isListeningForConfirmation]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowNavigationButtons(true);
  };
  const handleConfirm = () => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: inputValue }));
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setInputValue("");
      setIsListeningForConfirmation(false);
    } else {
      // Quiz completed
      console.log("Quiz completed. Answers:", answers);
      alert("Paperwork complete");
    }
  };
  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setAnswers(prev => ({ ...prev, [currentQuestion]: inputValue }));
      setCurrentQuestion(prev => prev + 1);
      setInputValue(answers[currentQuestion + 1] || "");
      setShowNavigationButtons(false);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setAnswers(prev => ({ ...prev, [currentQuestion]: inputValue }));
      setCurrentQuestion(prev => prev - 1);
      setInputValue(answers[currentQuestion - 1] || "");
      setShowNavigationButtons(false);
    }
  };
  const handleReject = () => {
    setInputValue("");
    setIsListeningForConfirmation(false);
  };

  const validateAnswer = async (question: string, answer: string) => {
    try {
      const response = await fetch('/api/validate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, answer }),
      });
      const data = await response.json();
      const result = JSON.parse(data.result.replace(/```json|```/g, ''));
      return {
        isValid: result.isValid,
        answer: result.answer,
        reason: result.reason
      };
    } catch (error) {
      console.error('Error validating answer:', error);
      return { isValid: false, answer: "", reason: "Error validating answer" };
    }
  };

  return (
    <>
      <div className="flex h-full antialiased font-sans">
        <div className="flex flex-row h-full w-full overflow-x-hidden">
          <div className="flex flex-col flex-auto h-full">
            <div className="relative w-full h-full">
              <AudioPlayer src="/bubolo intro.mp3" />
              {microphone && <Visualizer microphone={microphone} />}
              
              <div className="absolute inset-0 flex items-center justify-center">
                {!showQuiz ? (
                  <ButtonEffect
                    glow={true}
                    style={{
                      boxShadow: '0px 8px 15px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease 0s',
                    }}
                    onClick={() => {
                      console.log("Starting quiz...");
                      setShowQuiz(true);
                    }}
                    className="glow-on-hover text-lg font-semibold"
                  >
                    Start Medical Intake Paperwork
                  </ButtonEffect>
                ) : (
                  <Card className="w-[400px] bg-gray-900 bg-opacity-95 text-white shadow-2xl rounded-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 py-6">
                      <CardTitle className="text-3xl font-bold text-center text-white">
                        Medical Intake
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Progress
                        value={((currentQuestion + 1) / questions.length) * 100}
                        className="mb-6 h-2"
                      />
                      <h2 className="text-xl font-semibold mb-4 text-gray-200">
                        {questions[currentQuestion].question}
                      </h2>
                      {questions[currentQuestion].type === "radio" ? (
                        <RadioGroup
                          onValueChange={(value) => {
                            setInputValue(value);
                            setIsListeningForConfirmation(true);
                            setShowNavigationButtons(true);
                          }}
                          value={inputValue}
                          className="space-y-2"
                        >
                          {questions[currentQuestion].options?.map((option) => (
                            <div
                              key={option}
                              className="flex items-center space-x-3 bg-gray-800 p-3 rounded-lg"
                            >
                              <RadioGroupItem
                                value={option}
                                id={option}
                                className="text-purple-400"
                              />
                              <Label
                                htmlFor={option}
                                className="text-base font-medium leading-none cursor-pointer"
                              >
                                {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      ) : (
                        <input
                          type="text"
                          className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          value={inputValue}
                          onChange={handleInputChange}
                          placeholder="Type or speak your answer"
                        />
                      )}
                      {showNavigationButtons && (
                        <div className="mt-6 flex justify-between">
                          <Button 
                            onClick={handleBack} 
                            disabled={currentQuestion === 0}
                            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
                          >
                            Back
                          </Button>
                          <Button 
                            onClick={handleNext}
                            disabled={currentQuestion === questions.length - 1}
                            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
                          >
                            Next
                          </Button>
                        </div>
                      )}
                      {isListeningForConfirmation && (
                        <div className="mt-6 flex justify-between">
                          <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold">
                            Confirm
                          </Button>
                          <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold">
                            Try Again
                          </Button>
                        </div>
                      )}
                      {currentQuestion === questions.length - 1 && (
                        <Button
                          onClick={() => alert("Quiz completed!")}
                          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-semibold text-lg"
                        >
                          Submit
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
              <div className="absolute bottom-[8rem] inset-x-0 max-w-4xl mx-auto text-center">
                {caption && <span className="bg-black/80 p-4 rounded-lg text-white text-lg">{caption}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};


export default App; 