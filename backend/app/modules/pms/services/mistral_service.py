import os
import json
import re
from mistralai.client import Mistral

# Using a default key for now, should be in env
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY', 'yTXgl26YgEUx0NeDkgQPlRHL7TmClmMy')
mistral_client = Mistral(api_key=MISTRAL_API_KEY)

async def generate_chat_completion(user_message, conversation_history=None, system_prompt='', model='mistral-medium-latest'):
    if conversation_history is None:
        conversation_history = []
        
    try:
        # Format messages for Mistral
        messages = []
        
        # Add system prompt if provided
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })
            
        # Add conversation history
        for msg in conversation_history[-10:]:
            messages.append({
                "role": "user" if msg.get('role') == 'user' else "assistant",
                "content": msg.get('content', '')
            })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message
        })

        chat_response = mistral_client.chat.complete(
            model=model,
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )

        response_content = chat_response.choices[0].message.content if chat_response.choices else \
                          "I apologize, but I could not generate a response."
        
        return response_content
    except Exception as e:
        print(f"Mistral AI Error: {e}")
        raise e

async def generate_structured_response(prompt, model='mistral-medium-latest'):
    try:
        json_prompt = f"{prompt}\n\nIMPORTANT: Respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, or additional text. Just the JSON object."
        
        chat_response = mistral_client.chat.complete(
            model=model,
            messages=[{
                "role": "user",
                "content": json_prompt
            }],
            temperature=0.3,
            max_tokens=1500
        )

        response_text = chat_response.choices[0].message.content if chat_response.choices else '{}'
        
        # Try to parse JSON
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            # If parsing fails, try to extract JSON from markdown code blocks
            json_match = re.search(r"```json\s*([\s\S]*?)\s*```", response_text) or \
                         re.search(r"```\s*([\s\S]*?)\s*```", response_text)
            if json_match:
                return json.loads(json_match.group(1))
            
            # Final attempt: find the first { and last }
            first_brace = response_text.find('{')
            last_brace = response_text.rfind('}')
            if first_brace != -1 and last_brace != -1:
                return json.loads(response_text[first_brace:last_brace+1])
                
            raise Exception('Failed to parse JSON response')
    except Exception as e:
        print(f"Mistral Structured Response Error: {e}")
        raise e
