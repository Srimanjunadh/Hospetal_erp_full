"""
Async RabbitMQ Event Bus Client
Manages publisher and consumer lifecycles using aio-pika.
Topic-based exchange 'pms_events' handles domain event routing.
"""
import asyncio
import os
import json
import logging
from typing import Callable, Coroutine, Any, Dict
from pydantic import BaseModel
import aio_pika
from aio_pika import Message, ExchangeType

logger = logging.getLogger("event_bus")

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
EXCHANGE_NAME = "pms_events"

class EventBus:
    _connection = None

    @classmethod
    async def get_connection(cls) -> aio_pika.RobustConnection:
        """
        Maintains and returns a robust connection to the RabbitMQ broker.
        """
        if cls._connection is None or cls._connection.is_closed:
            try:
                cls._connection = await aio_pika.connect_robust(RABBITMQ_URL)
                logger.info("Successfully established connection to RabbitMQ broker")
            except Exception as e:
                logger.warning(f"RabbitMQ connection failed at url={RABBITMQ_URL}: {e}")
                raise e
        return cls._connection

    @classmethod
    async def publish(cls, routing_key: str, event: BaseModel) -> bool:
        """
        Serializes and publishes a domain event using a specific routing key.
        Degrades gracefully if RabbitMQ is not available.
        """
        try:
            connection = await cls.get_connection()
            async with connection.channel() as channel:
                # Declare topic exchange
                exchange = await channel.declare_exchange(
                    EXCHANGE_NAME,
                    ExchangeType.TOPIC,
                    durable=True
                )
                
                # Serialize event
                payload = event.model_dump_json().encode("utf-8")
                
                message = Message(
                    body=payload,
                    content_type="application/json",
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT
                )
                
                await exchange.publish(message, routing_key=routing_key)
                logger.info(f"Published event routing_key='{routing_key}'")
                return True
        except Exception as e:
            logger.warning(f"Failed to publish event to RabbitMQ broker: {e}. Degrading gracefully...")
            return False

    @classmethod
    async def subscribe(
        cls, 
        queue_name: str, 
        routing_key: str, 
        handler: Callable[[Dict[str, Any]], Coroutine[Any, Any, None]]
    ) -> bool:
        """
        Spawns a background consumer task listening for events matching the routing key on a durable queue.
        """
        async def consumer_loop():
            retry_wait = 2
            while True:
                try:
                    connection = await cls.get_connection()
                    async with connection.channel() as channel:
                        # Prefetch limits queue congestion
                        await channel.set_prefetch(1)
                        
                        exchange = await channel.declare_exchange(
                            EXCHANGE_NAME,
                            ExchangeType.TOPIC,
                            durable=True
                        )
                        
                        queue = await channel.declare_queue(queue_name, durable=True)
                        await queue.bind(exchange, routing_key=routing_key)
                        
                        logger.info(f"Subscribed queue='{queue_name}' routing_key='{routing_key}'")
                        
                        async with queue.iterator() as queue_iter:
                            async for message in queue_iter:
                                async with message.process():
                                    try:
                                        payload = json.loads(message.body.decode("utf-8"))
                                        await handler(payload)
                                    except Exception as handler_err:
                                        logger.error(f"Error executing event handler in queue {queue_name}: {handler_err}", exc_info=True)
                except Exception as conn_err:
                    logger.warning(f"Consumer queue={queue_name} disconnected: {conn_err}. Reconnecting in {retry_wait}s...")
                    await asyncio.sleep(retry_wait)
                    retry_wait = min(retry_wait * 2, 60)

        # Launch consumer as a background asyncio task
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(consumer_loop())
            return True
        except RuntimeError:
            # Fallback if no loop is running
            return False
