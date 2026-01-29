require(Modules.OpenAI);
require(Modules.ElevenLabs);
require(Modules.Yandex);

var callId, ttsProvider, targetPhone, callerIdPhone, voiceType, language, stability, speed, similarityBoost, greetingMessage, systemPrompt, funnelGoal, webhookUrl, openaiApiKey, elevenlabsApiKey, elevenLabsAgentId, yandexApiKey, yandexFolderId;

var transcript = []  // Транскрипция

var callStartTimestamp = null;

// ===============================
// OPEN AI CUSTOM VARIABLES 
// ===============================
var call; 
var client;
var conversationalAIClient;

var currentUserText = "";
var currentAssistantText = "";

// ===============================
// OPEN AI CUSTOM VARIABLES END 
// ===============================

VoxEngine.addEventListener(AppEvents.Started, function(e) {
    var customData = VoxEngine.customData();

    if (!customData || customData.length === 0) {
        Logger.write("[ERROR] customData is empty — terminating");
        VoxEngine.terminate();
        return;
    }

    var data;
    try {
        data = JSON.parse(customData);
        Logger.write("[SUCCESS] JSON parsed successfully");
    } catch (err) {
        Logger.write("[ERROR] Failed to parse customData: " + err);
        VoxEngine.terminate();
        return;
    }

    callId = data.call_id;
    ttsProvider = data.tts_provider;
    targetPhone = data.phone;
    callerIdPhone = data.caller_id;
    voiceType = data.voice || "alloy";
    language = data.language || "ru";
    greetingMessage = data.greeting_message || "Hello, I am AI assistant HALO"
    systemPrompt = data.prompt || "You are a helpful AI assistant.";
    funnelGoal = data.funnel_goal || "Провести разговор с клиентом";
    webhookUrl = data.webhook_url || null;
    openaiApiKey = data.openai_api_key;
    elevenlabsApiKey = data.elevenlabs_api_key;
    elevenLabsAgentId = data.elevenlabs_agent_id;
    yandexApiKey = data.yandex_api_key;
    yandexFolderId = data.yandex_folder_id;
    stability = data.stability || null;
    speed = data.speed || null;
    similarityBoost = data.similarity_boost || null;

    Logger.write("=== 📞 CALL CONFIG ===");
    
    Logger.write("data: " + data);
    Logger.write("callId: " + callId);
    Logger.write("targetPhone: " + targetPhone);
    Logger.write("callerIdPhone: " + callerIdPhone);
    Logger.write("voiceType: " + voiceType);
    Logger.write("language: " + language);
    Logger.write("greetingMessage: " + greetingMessage);
    Logger.write("systemPrompt: " + systemPrompt);
    Logger.write("funnelGoal: " + funnelGoal);
    Logger.write("webhookUrl: " + (webhookUrl || "null"));
    Logger.write("openaiApiKey: " + (openaiApiKey ? "***SET***" : "NOT SET"));
    Logger.write("elevenlabsApiKey: " + (elevenlabsApiKey ? "***SET***" : "NOT SET"));
    Logger.write("elevenLabsAgentId: " + elevenLabsAgentId);
    Logger.write("yandexApiKey: " + yandexApiKey);
    Logger.write("yandexFolderId: " + yandexFolderId);
    Logger.write("stability: " + stability);
    Logger.write("speed: " + speed);
    Logger.write("similarityBoost: " + similarityBoost);
    Logger.write("======================");

    // 📞 Делаем исходящий звонок
    call = VoxEngine.callPSTN(targetPhone, callerIdPhone);

    // Подписываемся на события звонка (можно здесь или снаружи — не важно)
    if (ttsProvider === "openai") {
        call.addEventListener(CallEvents.Connected, onCallConnectedOpenAI);
        call.addEventListener(CallEvents.Disconnected, onCallDisconnectedOpenAI);
        call.addEventListener(CallEvents.Failed, onCallFailedOpenAI);
    } else if (ttsProvider === "elevenlabs") {
        call.addEventListener(CallEvents.Connected, onCallConnectedElevenLabs);
        call.addEventListener(CallEvents.Disconnected, onCallDisconnectedElevenLabs);
        call.addEventListener(CallEvents.Failed, onCallFailedElevenLabs);
    } else if (ttsProvider === "yandex") {
        call.addEventListener(CallEvents.Connected, onCallConnectedYandex);
        call.addEventListener(CallEvents.Disconnected, onCallDisconnectedYandex);
        call.addEventListener(CallEvents.Failed, onCallFailedYandex);
    }
});

// ===============================
// 📞 Обработчики звонка OpenAI 
// ===============================

function onCallConnectedOpenAI() {
    Logger.write("[CONNECTED] Call connected");

    callStartTimestamp = Date.now();

    OpenAI.createRealtimeAPIClient({
        apiKey: openaiApiKey,
        model: "gpt-realtime",
        type: OpenAI.RealtimeAPIClientType.REALTIME,
        onWebSocketClose: function() {
            Logger.write("[WS] Closed");
        }
    }).then(function(realtimeClient) {
        client = realtimeClient
        Logger.write("[AI] Realtime client created");

        var fullChangedPrompt = "ВСЕГДА начинай новый диалог с ФРАЗУ '" + greetingMessage + "' ГОВОРИ ЕЕ ПЕРВЫМ СООБЩЕНИЕМ И БОЛЬШЕ НЕ ПОВТОРЯЙ. ПЕРВОЕ СООБЩЕНИЕ ДОЛЖНО БЫТЬ ТОЛЬКО ЭТА ФРАЗА И ВСЕ!\n\nЦЕЛЬ ЗВОНКА (ВОРОНКА): " + funnelGoal + "\n\nСИСТЕМНАЯ ИНСТРУКЦИЯ: " + systemPrompt

        // ===============================
        // 🎤 Функция добавления в транскрипцию
        // ===============================
        function addToTranscript(role, text) {
            if (text && text.trim()) {
                // transcript.push({
                //     role: role,          // "user" или "assistant"
                //     text: text.trim(),
                //     timestamp: new Date().toISOString()
                // });
                transcript.push(`${role}: ${text}`)
                Logger.write("[TRANSCRIPT] " + role + ": " + text.trim());
            }
        }

        // ===============================
        // 📡 ПОДПИСКИ НА СОБЫТИЯ OPENAI (ПОСЛЕ СОЗДАНИЯ КЛИЕНТА!)
        // ===============================

        
        // Дельты пользователя (работает)
        client.addEventListener(OpenAI.RealtimeAPIEvents.ConversationItemInputAudioTranscriptionDelta, function(evt) {
            Logger.write("[DEBUG] User delta event fired");
            var delta = null;
            
            // Voximplant передает события в формате {data: {payload: {delta: "текст"}}}
            if (evt && evt.data && evt.data.payload && evt.data.payload.delta) {
                delta = evt.data.payload.delta;
            } else if (evt && evt.payload && evt.payload.delta) {
                delta = evt.payload.delta;
            } else if (evt && evt.delta) {
                delta = evt.delta;
            } else if (typeof evt === "string") {
                delta = evt;
            }
            
            if (delta && typeof delta === "string" && delta.length > 0) {
                currentUserText += delta;
                Logger.write("[DELTA USER] '" + delta + "'");
            } else {
                Logger.write("[DEBUG] User delta is empty or invalid");
            }
        });
        Logger.write("[DEBUG] User delta listener registered");

        // Завершение реплики пользователя (работает)
        client.addEventListener(OpenAI.RealtimeAPIEvents.ConversationItemInputAudioTranscriptionCompleted, function(evt) {
            Logger.write("[DEBUG] User transcription completed");

            if (currentUserText && currentUserText.trim().length > 0) {
                addToTranscript("Пользователь", currentUserText);
                Logger.write("[USER COMPLETE] Added to transcript: '" + currentUserText + "'");
                currentUserText = "";
            } else {
                Logger.write("[USER COMPLETE] No text accumulated");
            }
        });
        Logger.write("[DEBUG] User completion listener registered");

        // Прерывание (работает)
        client.addEventListener(OpenAI.RealtimeAPIEvents.InputAudioBufferSpeechStarted, function(evt) {
            Logger.write("[INTERRUPTION] User speech started - clearing buffer");
            if (client && client.clearMediaBuffer) {
                client.clearMediaBuffer();
            }
        });
        Logger.write("[DEBUG] Interruption listener registered");
        
        // ===============================
        // Транскрипция АССИСТЕНТА
        // ===============================
        
        // Дельты транскрипции ассистента
        if (OpenAI.RealtimeAPIEvents.ResponseOutputAudioTranscriptDelta) {
            client.addEventListener(OpenAI.RealtimeAPIEvents.ResponseOutputAudioTranscriptDelta, function(evt) {
                Logger.write("[DEBUG] Assistant delta event fired");
                var delta = null;
                
                // Voximplant передает события в формате {data: {payload: {delta: "текст"}}}
                if (evt && evt.data && evt.data.payload && evt.data.payload.delta) {
                    delta = evt.data.payload.delta;
                } else if (evt && evt.payload && evt.payload.delta) {
                    delta = evt.payload.delta;
                } else if (evt && evt.delta) {
                    delta = evt.delta;
                } else if (typeof evt === "string") {
                    delta = evt;
                }
                
                if (delta && typeof delta === "string" && delta.length > 0) {
                    currentAssistantText += delta;
                    Logger.write("[DELTA ASSISTANT] '" + delta + "'");
                }
            });
            Logger.write("[DEBUG] Assistant delta listener registered");
        }
        
        // Завершение транскрипции ассистента
        if (OpenAI.RealtimeAPIEvents.ResponseOutputAudioTranscriptDone) {
            client.addEventListener(OpenAI.RealtimeAPIEvents.ResponseOutputAudioTranscriptDone, function(evt) {
                Logger.write("[DEBUG] Assistant transcription done");
                
                if (currentAssistantText && currentAssistantText.trim().length > 0) {
                    addToTranscript("Агент", currentAssistantText);
                    Logger.write("[ASSISTANT DONE] Added to transcript: '" + currentAssistantText + "'");
                    currentAssistantText = "";
                } else {
                    Logger.write("[ASSISTANT DONE] No text accumulated");
                }
            });
            Logger.write("[DEBUG] Assistant completion listener registered");
        }
        
        Logger.write("[DEBUG] All event subscriptions completed");

        // ===============================
        // ⚙️ КОНФИГУРАЦИЯ СЕССИИ (ПОСЛЕ ПОДПИСКИ НА СОБЫТИЯ!)
        // ===============================
        try {
            Logger.write("[DEBUG] Starting session configuration...");
            
            client.sessionUpdate({
                session: {
                    type: "realtime",
                    instructions: fullChangedPrompt,
                    max_response_output_tokens: 4096,
                    audio: {
                        output: { 
                            voice: voiceType,
                            transcription: { model: "whisper-1" }
                        },
                        input: {
                            transcription: { model: "whisper-1", language: language || null },
                            turn_detection: {
                                type: "server_vad",
                                create_response: true,
                                interrupt_response: true,
                                threshold: 0.4,
                                silence_duration_ms: 500,
                                prefix_padding_ms: 50
                            }
                        }
                    }
                }
            });

            Logger.write("[AI] Session configured successfully");
        } catch (err) {
            Logger.write("[ERROR] Session configuration failed: " + err + ", stack: " + err.stack);
            throw err;
        }

        client.sendMediaTo(call);
        call.sendMediaTo(client);

        Logger.write("[STREAMING] audio connected - streaming greeting")

        setTimeout(function() {
            client.conversationItemCreate({
                type: "message",
                role: "assistant",
                content: [
                    {
                        type: "text",
                        text: greetingMessage
                    }
                ]
            });

            client.responseCreate();  // Запускаем генерацию аудио для этого сообщения
            Logger.write("[GREETING] Sent: " + greetingMessage);
        }, 1000);  // небольшая задержка, чтобы аудио-канал точно установился

    }).catch(function(err) {
        Logger.write("[ERROR] OpenAI client error: " + err);
        if (call) {
            call.hangup();
        }
    });
}

function onCallDisconnectedOpenAI() {
    Logger.write("[DISCONNECTED] Call ended");

    var callDuration = 0;

    if (callStartTimestamp) {
        callDurationSeconds = Math.floor(
            (Date.now() - callStartTimestamp) / 1000
        );
    }

    Logger.write("[CALL DURATION] " + callDurationSeconds + " seconds");

    // Формируем финальную транскрипцию
    var fullTranscript = transcript;
    
    Logger.write("[FULL TRANSCRIPT]\n" + (fullTranscript || "(empty)"));

    // Отправляем на webhook
    if (webhookUrl) {
        // Определяем финальный URL
        var finalUrl = webhookUrl;
        
        // Если URL не содержит путь к endpoint, добавляем его
        if (webhookUrl.indexOf('/api/call-transcript') === -1) {
            finalUrl = webhookUrl + '/api/call-transcript';
        }
        
        Logger.write("[WEBHOOK] Sending to: " + finalUrl);
        
        Net.httpRequestAsync(finalUrl, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            postData: JSON.stringify({
                call_id: callId,
                phone: targetPhone,
                duration_seconds: callDurationSeconds,
                transcript: transcript,
                raw_text: fullTranscript
            })
        }).then(function(response) {
            Logger.write("[WEBHOOK] Transcript sent successfully. Status: " + response.code);
            Logger.write("[WEBHOOK] Response: " + response.text);
            VoxEngine.terminate();
        }).catch(function(err) {
            Logger.write("[WEBHOOK ERROR] " + err);
            VoxEngine.terminate();
        });
    } else {
        Logger.write("[WEBHOOK] webhook_url не указан — транскрипция только в логах");
        VoxEngine.terminate();
    }
}

function onCallFailedOpenAI(e) {
    Logger.write("[FAILED] " + e.code + " - " + e.reason);
    VoxEngine.terminate();
}

// ==================================
// 📞 Обработчики звонка ElevenLabs
// ==================================

async function onCallConnectedElevenLabs() {
    Logger.write("Звонок соединён → подключаем ElevenLabs Conversational AI");

    callStartTimestamp = Date.now()

    const onWebSocketClose = (event) => {
      Logger.write("=== WebSocket closed ===");
      Logger.write(JSON.stringify(event));
      cleanup();
    };

    const params = {
      xiApiKey: elevenlabsApiKey,
      agentId: elevenLabsAgentId,
      onWebSocketClose,
      // Дополнительные параметры по необходимости (см. доки)
      // Например: sampleRate: 16000, или другие настройки
    };

    try {
      conversationalAIClient = await ElevenLabs.createConversationalAIClient(params);

      summaryPrompt = systemPrompt + "\n\nГЛАВНАЯ ЦЕЛЬ: " + funnelGoal;

      // Опционально: переопределение конфигурации агента на лету (если нужно)
      const override = {
        conversation_config_override: {
          tts: {
            voice_id: voiceType,
            stability: stability,
            speed: speed,
            similarity_boost: similarityBoost
          },
          agent: {
            prompt: { prompt: summaryPrompt },
            first_message: greetingMessage,
            language: language
          }
        }
      };

      conversationalAIClient.conversationInitiationClientData(override);

      // Подключаем медиа двунаправленно: звонок ↔ AI клиент
      VoxEngine.sendMediaBetween(call, conversationalAIClient);

      // Логируем все важные события (как в твоём примере)
      const logEvent = (eventName) => (evt) => {
        Logger.write(`=== ${eventName} ===`);
        Logger.write(JSON.stringify(evt));
      };

      conversationalAIClient.addEventListener(ElevenLabs.ConversationalAIEvents.Unknown, logEvent("Unknown"));
      conversationalAIClient.addEventListener(ElevenLabs.ConversationalAIEvents.HTTPResponse, logEvent("HTTPResponse"));
      conversationalAIClient.addEventListener(ElevenLabs.ConversationalAIEvents.ConversationInitiationMetadata, logEvent("ConversationInitiationMetadata"));
      conversationalAIClient.addEventListener(ElevenLabs.ConversationalAIEvents.Ping, logEvent("Ping"));
      conversationalAIClient.addEventListener(ElevenLabs.ConversationalAIEvents.UserTranscript, (evt) => {
        const text = evt.data.payload.user_transcription_event.user_transcript;
        transcript.push(`Пользователь: ${text}`);
        Logger.write(`Пользователь: ${text}`);
      });

      conversationalAIClient.addEventListener(ElevenLabs.ConversationalAIEvents.AgentResponse, (evt) => {
        const text = evt.data.payload.agent_response_event.agent_response;
        transcript.push(`Агент: ${text}`);
        Logger.write(`Агент: ${text}`);
      });
      conversationalAIClient.addEventListener(ElevenLabs.ConversationalAIEvents.AgentResponseCorrection, logEvent("AgentResponseCorrection"));
      conversationalAIClient.addEventListener(ElevenLabs.ConversationalAIEvents.Interruption, (evt) => {
        logEvent("Interruption")(evt);
        if (conversationalAIClient) conversationalAIClient.clearMediaBuffer();
      });
      conversationalAIClient.addEventListener(ElevenLabs.ConversationalAIEvents.ClientToolCall, logEvent("ClientToolCall"));
      conversationalAIClient.addEventListener(ElevenLabs.ConversationalAIEvents.ContextualUpdate, logEvent("ContextualUpdate"));
      conversationalAIClient.addEventListener(ElevenLabs.ConversationalAIEvents.VadScore, logEvent("VadScore"));
      conversationalAIClient.addEventListener(ElevenLabs.ConversationalAIEvents.InternalTentativeAgentResponse, logEvent("InternalTentativeAgentResponse"));

      // Опционально: отправить первое текстовое сообщение от пользователя (если нужно инициировать)
      // conversationalAIClient.userMessage({ text: "Начни разговор" });
    } catch (err) {
      Logger.write("=== Ошибка при создании ConversationalAIClient ===");
      Logger.write(err.message || String(err));
      cleanup();
    }
}

function onCallDisconnectedElevenLabs() {
    Logger.write("transcript:\n" + transcript.join("\n"));
    if (conversationalAIClient) {
      conversationalAIClient.close();
      conversationalAIClient = null;
    }
    var callDurationSeconds = 0;

    if (callStartTimestamp) {
        callDurationSeconds = Math.floor(
            (Date.now() - callStartTimestamp) / 1000
        );
    }

    Logger.write("[CALL DURATION] " + callDurationSeconds + " seconds");

    // Формируем финальную транскрипцию
    var fullTranscript = transcript
    
    Logger.write("[FULL TRANSCRIPT]\n" + (fullTranscript || "(empty)"));

    // Отправляем на webhook
    if (webhookUrl) {
        // Определяем финальный URL
        var finalUrl = webhookUrl;
        
        // Если URL не содержит путь к endpoint, добавляем его
        if (webhookUrl.indexOf('/api/call-transcript') === -1) {
            finalUrl = webhookUrl + '/api/call-transcript';
        }
        
        Logger.write("[WEBHOOK] Sending to: " + finalUrl);
        
        Net.httpRequestAsync(finalUrl, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            postData: JSON.stringify({
                call_id: callId,
                phone: targetPhone,
                duration_seconds: callDurationSeconds,
                transcript: transcript,
                raw_text: fullTranscript
            })
        }).then(function(response) {
            Logger.write("[WEBHOOK] Transcript sent successfully. Status: " + response.code);
            Logger.write("[WEBHOOK] Response: " + response.text);
            VoxEngine.terminate();
        }).catch(function(err) {
            Logger.write("[WEBHOOK ERROR] " + err);
            VoxEngine.terminate();
        });
    } else {
        Logger.write("[WEBHOOK] webhook_url не указан — транскрипция только в логах");
        VoxEngine.terminate();
    }
    VoxEngine.terminate();
};

function onCallFailedElevenLabs (e) {
    Logger.write(`Call Failed: ${e.reason || "unknown"}`);
    onCallDisconnectedElevenLabs();
}

// ==================================
// 📞 Обработчики звонка Yandex
// ==================================

async function onCallConnectedYandex () {
    callStartTimestamp = Date.now()
    const onWebSocketClose = (event) => {
        Logger.write('===ON_WEB_SOCKET_CLOSE==');
        Logger.write(JSON.stringify(event));
        VoxEngine.terminate();
    };

    const realtimeAPIClientParameters = {
        apiKey: yandexApiKey,
        folderId: yandexFolderId,
        onWebSocketClose,
    };

    function addToTranscript(role, text) {
        if (text && text.trim()) {
            transcript.push(`${role}: ${text.trim()}`);
            Logger.write("[TRANSCRIPT] " + role + ": " + text.trim());
        }
    }

    try {
        var hangup = false;
        realtimeAPIClient = await Yandex.createRealtimeAPIClient(realtimeAPIClientParameters);

        client = realtimeAPIClient;
        
        VoxEngine.sendMediaBetween(call, realtimeAPIClient);
        call.record({hd_audio: true, stereo: true});

        realtimeAPIClient.addEventListener(Yandex.RealtimeAPIEvents.SessionCreated, (event) => {
        Logger.write('===Yandex.RealtimeAPIEvents.SessionCreated===');
        Logger.write(JSON.stringify(event));

        var fullChangedPrompt = "ВСЕГДА начинай новый диалог с ФРАЗЫ '" + greetingMessage + "' ГОВОРИ ЕЕ ПЕРВЫМ СООБЩЕНИЕМ И БОЛЬШЕ НЕ ПОВТОРЯЙ. ПЕРВОЕ СООБЩЕНИЕ ДОЛЖНО БЫТЬ ТОЛЬКО ЭТА ФРАЗА И ВСЕ!\n\nЦЕЛЬ ЗВОНКА (ВОРОНКА): " + funnelGoal + "\n\nСИСТЕМНАЯ ИНСТРУКЦИЯ: " + systemPrompt

        const sessionUpdateParameters = {
            "session": {
            "output_modalities": [
                'audio',
            ],
            "type": 'realtime',
            "instructions": fullChangedPrompt,
            "audio": {
                "output": {
                    "voice": voiceType,
                    "speed": speed
                }
            },
            "turn_detection": {
                "type": "server_vad", // turn on server VAD
                "threshold": 0.5, // sensitivity
                "silence_duration_ms": 400, // silence duration to end the phrase
            },
            "tools": [
                {
                "type": "function",
                "name": "hangup_call",
                "description": "Завершить звонок",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
                },
                {
                "type": "function",
                "name": "web_search",
                "description": "Поиск в интернете",
                "parameters": "{}",
                },
            ]
            },
        };

        realtimeAPIClient.sessionUpdate(sessionUpdateParameters);

        const response = {
            instructions: 'Привет!',
        };
        realtimeAPIClient.responseCreate(response);
        });

        realtimeAPIClient.addEventListener(Yandex.RealtimeAPIEvents.SessionUpdated, (event) => {
        Logger.write('===Yandex.RealtimeAPIEvents.SessionUpdated===');
        Logger.write(JSON.stringify(event));
        });

        realtimeAPIClient.addEventListener(Yandex.RealtimeAPIEvents.Unknown, (event) => {
        Logger.write('===Yandex.RealtimeAPIEvents.Unknown===');
        Logger.write(JSON.stringify(event));
        });

        realtimeAPIClient.addEventListener(Yandex.RealtimeAPIEvents.Error, (event) => {
        Logger.write('===Yandex.RealtimeAPIEvents.Error===');
        Logger.write(JSON.stringify(event));
        });

        realtimeAPIClient.addEventListener(Yandex.RealtimeAPIEvents.WebSocketError, (event) => {
        Logger.write('===Yandex.RealtimeAPIEvents.WebSocketError===');
        Logger.write(JSON.stringify(event));
        });

        realtimeAPIClient.addEventListener(Yandex.RealtimeAPIEvents.InputAudioBufferSpeechStarted, (event) => {
        Logger.write('===Yandex.RealtimeAPIEvents.InputAudioBufferSpeechStarted===');
        Logger.write(JSON.stringify(event));
        if (realtimeAPIClient) realtimeAPIClient.clearMediaBuffer();
        });

        realtimeAPIClient.addEventListener(Yandex.RealtimeAPIEvents.ResponseCreated, (event) => {
        Logger.write('===Yandex.RealtimeAPIEvents.ResponseCreated===');
        Logger.write(JSON.stringify(event));
        });

        realtimeAPIClient.addEventListener(Yandex.RealtimeAPIEvents.RateLimitsUpdated, (event) => {
        Logger.write('===Yandex.RealtimeAPIEvents.RateLimitsUpdated===');
        Logger.write(JSON.stringify(event));
        });

        realtimeAPIClient.addEventListener(Yandex.RealtimeAPIEvents.ResponseOutputAudioTranscriptDone, (event) => {
        Logger.write('===Yandex.RealtimeAPIEvents.ResponseOutputAudioTranscriptDone===');
        Logger.write(JSON.stringify(event));
        const text = event.data.payload?.transcript;
        if (text) {
            addToTranscript("Агент", text);  // Добавляем в transcript
        }
        });

        realtimeAPIClient.addEventListener(Yandex.RealtimeAPIEvents.ConversationItemInputAudioTranscriptionCompleted, (event) => {
            Logger.write('===Yandex.RealtimeAPIEvents.ConversationItemInputAudioTranscriptionCompleted===');
            Logger.write(JSON.stringify(event));
            const text = event.data.payload?.transcript;
            if (text) {
                addToTranscript("Пользователь", text);  // Добавляем в transcript
            }
        });

        realtimeAPIClient.addEventListener(Yandex.RealtimeAPIEvents.ResponseOutputItemDone, (event) => {
        Logger.write('===Yandex.RealtimeAPIEvents.ResponseOutputItemDone===');
        Logger.write(JSON.stringify(event));

        if (event.data.payload?.item?.type == "function_call" && event.data.payload?.item?.name == "hangup_call") {
            realtimeAPIClient.conversationItemCreate({
            item: {
                type: "function_call_output",
                call_id: event.data.payload?.item?.call_id,
                output: "Ok"
            }
            });
            Logger.write("HANGUP THE CALL");
            hangup = true;
            const response = {
            instructions: "Попрощайся перед завершением звонка."
            };
            realtimeAPIClient.responseCreate(response);
        }
        });

        realtimeAPIClient.addEventListener(Yandex.Events.WebSocketMediaStarted, (event) => {
        Logger.write('===Yandex.Events.WebSocketMediaStarted===');
        Logger.write(JSON.stringify(event));
        });

        realtimeAPIClient.addEventListener(Yandex.Events.WebSocketMediaEnded, (event) => {
        Logger.write('===Yandex.Events.WebSocketMediaEnded===');
        Logger.write(JSON.stringify(event));
        if (hangup) {
            setTimeout(() => call.hangup(), 1000);
        }
        });
    } catch (error) {
        Logger.write('===SOMETHING_WENT_WRONG===');
        Logger.write(error);
        VoxEngine.terminate();
    }
}

function onCallDisconnectedYandex () {
    if (client) client.close();

    var callDurationSeconds = 0;

    if (callStartTimestamp) {
        callDurationSeconds = Math.floor(
            (Date.now() - callStartTimestamp) / 1000
        );
    }

    Logger.write("[CALL DURATION] " + callDurationSeconds + " seconds");

    // Формируем финальную транскрипцию
    var fullTranscript = transcript
    
    Logger.write("[FULL TRANSCRIPT]\n" + (fullTranscript || "(empty)"));

    // Отправляем на webhook
    if (webhookUrl) {
        // Определяем финальный URL
        var finalUrl = webhookUrl;
        
        // Если URL не содержит путь к endpoint, добавляем его
        if (webhookUrl.indexOf('/api/call-transcript') === -1) {
            finalUrl = webhookUrl + '/api/call-transcript';
        }
        
        Logger.write("[WEBHOOK] Sending to: " + finalUrl);
        
        Net.httpRequestAsync(finalUrl, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            postData: JSON.stringify({
                call_id: callId,
                phone: targetPhone,
                duration_seconds: callDurationSeconds,
                transcript: transcript,
                raw_text: fullTranscript
            })
        }).then(function(response) {
            Logger.write("[WEBHOOK] Transcript sent successfully. Status: " + response.code);
            Logger.write("[WEBHOOK] Response: " + response.text);
            VoxEngine.terminate();
        }).catch(function(err) {
            Logger.write("[WEBHOOK ERROR] " + err);
            VoxEngine.terminate();
        });
    } else {
        Logger.write("[WEBHOOK] webhook_url не указан — транскрипция только в логах");
        VoxEngine.terminate();
    }
    VoxEngine.terminate();
}

function onCallFailedYandex(e) {
    Logger.write("[FAILED] " + e.code + " - " + e.reason);
    VoxEngine.terminate();
}

