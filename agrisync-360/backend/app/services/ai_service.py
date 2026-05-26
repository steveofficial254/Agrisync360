class AIService:
    @staticmethod
    def generate_chat_response(message):
        # Gracefully handle missing API key
        return f"AI Assistant received: {message}. This is a simulated response as per requirements."

    @staticmethod
    def generate_yield_summary(crop_name, area, quantity):
        return f"Yield Summary: {quantity}kg of {crop_name} harvested from {area} acres. Excellent work!"
