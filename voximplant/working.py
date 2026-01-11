 async def initiate_call(self, call_id: str, phone: str) -> None:
        """
        Initiate an outbound call via Voximplant HTTP API.

        Uses StartScenarios endpoint to start a VoxEngine scenario
        that will make the call.

        Args:
            call_id: Unique identifier for the call
            phone: Phone number to call (E.164 format, e.g., +79991234567)
        """
        try:
            logger.info(f"[Voximplant] Initiating call | call_id={call_id} | phone={phone}")

            # Prepare custom data to pass to VoxEngine scenario
            custom_data = {
                "call_id": call_id,
                "phone": phone,
                "caller_id": self.caller_id,
                "webhook_url": f"{self.backend_url}/voximplant/events"
            }

            # Prepare API request
            payload = {
                "account_id": self.account_id,
                "api_key": self.api_key,
                "rule_id": self.rule_id,
                "script_custom_data": json.dumps(custom_data)
            }

            # Make API call to start scenario
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/StartScenarios",
                    data=payload
                ) as resp:
                    result = await resp.json()

                    if result.get("result") == 1:
                        # Success
                        media_session_id = result.get("media_session_access_url")

                        self.active_calls[call_id] = {
                            "phone": phone,
                            "status": "initiating",
                            "media_session_id": media_session_id,
                            "started_at": datetime.utcnow()
                        }

                        self.audio_queue[call_id] = asyncio.Queue()

                        logger.info(
                            f"[Voximplant] Call initiated successfully | "
                            f"call_id={call_id} | media_session_id={media_session_id}"
                        )

                        # Start polling for call status
                        poll_task = asyncio.create_task(self._poll_call_status(call_id))
                        self.polling_tasks[call_id] = poll_task
                    else:
                        # Error
                        error_msg = result.get("error", {}).get("msg", "Unknown error")
                        logger.error(
                            f"[Voximplant] Failed to initiate call | "
                            f"call_id={call_id} | error={error_msg}"
                        )

                        # Notify orchestrator of failure
                        if self.event_callback:
                            await self.event_callback(
                                call_id,
                                TelephonyEvent.ERROR,
                                f"API error: {error_msg}"
                            )

        except Exception as e:
            logger.error(
                f"[Voximplant] Exception during call initiation | "
                f"call_id={call_id} | error={e}",
                exc_info=True
            )

            if self.event_callback:
                await self.event_callback(
                    call_id,
                    TelephonyEvent.ERROR,
                    f"Exception: {str(e)}"
                )
