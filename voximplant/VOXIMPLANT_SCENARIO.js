require(Modules.OpenAI);

Logger.write("HALO AI Voice Assistant - Production v1.0");

// Глобальные переменные (будут заполнены внутри Started)
var callId, targetPhone, callerIdPhone, voiceType, language, greetingMessage, systemPrompt, funnelGoal, webhookUrl, openaiApiKey;
var call;  // для доступа в других событиях
var transcript = []  // Транскрипция
var client;

// ===============================
// 🔗 Основной обработчик старта сессии
// ===============================
VoxEngine.addEventListener(AppEvents.Started, function(e) {
    // 🔎 Читаем customData ЗДЕСЬ — гарантированно придёт!
    var customData = VoxEngine.customData();
    Logger.write("[INFO] customData received: " + customData);
    Logger.write("[INFO] customData type: " + typeof customData);
    Logger.write("[INFO] customData length: " + (customData ? customData.length : 0));

    if (!customData || customData.length === 0) {
        Logger.write("[ERROR] customData is empty — terminating");
        VoxEngine.terminate();
        return;
    }

    // 🧠 Парсим JSON
    var data;
    try {
        data = JSON.parse(customData);
        Logger.write("[SUCCESS] JSON parsed successfully");
    } catch (err) {
        Logger.write("[ERROR] Failed to parse customData: " + err);
        VoxEngine.terminate();
        return;
    }

    // ⚡ Извлекаем параметры
    callId = data.call_id;
    targetPhone = data.phone;
    callerIdPhone = data.caller_id;
    voiceType = data.voice || "alloy";
    language = data.language || "ru";
    greetingMessage = data.greeting_message || "Hello, I am AI assistant HALO"
    systemPrompt = data.prompt || "You are a helpful AI assistant.";
    funnelGoal = data.funnel_goal || "Провести разговор с клиентом";
    webhookUrl = data.webhook_url || null;
    openaiApiKey = data.openai_api_key;

    Logger.write("[CONFIG] phone=" + targetPhone + ", voice=" + voiceType + ", language=" + language + ", prompt=" + systemPrompt);

    // 📞 Делаем исходящий звонок
    call = VoxEngine.callPSTN(targetPhone, callerIdPhone);

    // Подписываемся на события звонка (можно здесь или снаружи — не важно)
    call.addEventListener(CallEvents.Connected, onCallConnected);
    call.addEventListener(CallEvents.Disconnected, onCallDisconnected);
    call.addEventListener(CallEvents.Failed, onCallFailed);
});


// ===============================
// 📞 Обработчики звонка (выносим в отдельные функции для чистоты)
// ===============================
function onCallConnected() {
    Logger.write("[CONNECTED] Call connected");

    OpenAI.createRealtimeAPIClient({
        apiKey: openaiApiKey,
        model: "gpt-realtime",
        type: OpenAI.RealtimeAPIClientType.REALTIME,
        onWebSocketClose: function() {
            Logger.write("[WS] Closed");
            VoxEngine.terminate();
        }
    }).then(function(realtimeClient) {
        client = realtimeClient
        Logger.write("[AI] Realtime client created");

        fullChangedPrompt = "ВСЕГДА начинай новый диалог с ФРАЗУ '" + greetingMessage + "' ГОВОРИ ЕЕ ПЕРВЫМ СООБЩЕНИЕМ И БОЛЬШЕ НЕ ПОВТОРЯЙ. ПЕРВОЕ СООБЩЕНИЕ ДОЛЖНО БЫТЬ ТОЛЬКО ЭТА ФРАЗА И ВСЕ!\n\nЦЕЛЬ ЗВОНКА (ВОРОНКА): " + funnelGoal + "\n\nСИСТЕМНАЯ ИНСТРУКЦИЯ: " + systemPrompt

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
                            threshold: 0.4,          // ← ниже = чувствительнее к речи (по умолчанию 0.5)
                            silence_duration_ms: 500, // ← короче = быстрее считает реплику законченной
                            prefix_padding_ms: 50   // ← меньше = быстрее реагирует на начало речи
                        }
                    }
                }
            }
        });

        Logger.write("[AI] Session configured, streaming started");

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

        // ===============================
        function addToTranscript(role, text) {
            if (text && text.trim()) {
                transcript.push({
                    role: role,          // "user" или "assistant"
                    text: text.trim(),
                    timestamp: new Date().toISOString()
                });
                Logger.write("[TRANSCRIPT] " + role + ": " + text.trim());
            }
        }

        // Подписываемся на события транскрипции от OpenAI
        client.addEventListener("conversation.item.input_audio_transcription.completed", function(e) {
            // Речь пользователя (полная реплика)
            Logger.write("[TRANSCRIPT] HUMAN")
            if (e.transcript) {
                Logger.write(e.transcript)
                addToTranscript("user", e.transcript);
            }
        });

        client.addEventListener("response.output_audio_transcript.done", function(e) {
            Logger.write("[TRANSCRIPT] AI")
            // Полный ответ AI
            if (e.transcript) {
                Logger.write(e.transcript)
                addToTranscript("assistant", e.transcript);
            }
        });

        client.addEventListener(OpenAI.RealtimeAPIEvents.InputAudioBufferSpeechStarted, function() {
            Logger.write("[INTERRUPTION] User started speaking - clearing output buffer");
            client.clearMediaBuffer();  // Это ключевой вызов!
        });

    }).catch(function(err) {
        Logger.write("[ERROR] OpenAI client error: " + err);
        call.hangup();
    });
}

function onCallDisconnected() {
    Logger.write("[DISCONNECTED] Call ended");

    // Формируем финальную транскрипцию (как раньше)
    var fullTranscript = transcript.map(t => `${t.role.toUpperCase()}: ${t.text}`).join("\n");
    Logger.write("[FULL TRANSCRIPT]\n" + (fullTranscript || "(empty)"));

    // Отправляем на webhook (как раньше)
    if (webhookUrl) {
        Net.httpRequestAsync(webhookUrl + '/api/call-transcript', {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            postData: JSON.stringify({
                call_id: callId,
                phone: targetPhone,
                transcript: transcript,
                raw_text: fullTranscript
            })
        }).then(function(response) {
            Logger.write("[WEBHOOK] Transcript sent successfully");
        }).catch(function(err) {
            Logger.write("[WEBHOOK ERROR] " + err);
        });
    } else {
        Logger.write("[WEBHOOK] webhook_url не указан — транскрипция только в логах");
    }

    VoxEngine.terminate();
}

function onCallFailed(e) {
    Logger.write("[FAILED] " + e.code + " - " + e.reason);
    VoxEngine.terminate();
}