from langchain_openai import AzureChatOpenAI
from dotenv import load_dotenv
import os

load_dotenv()


class Utils:
    _llm_instance = None
    _required_env_vars = [
        'AZURE_OPENAI_ENDPOINT',
        'AZURE_OPENAI_API_KEY',
        'AZURE_OPENAI_DEPLOYMENT_NAME',
        'AZURE_OPENAI_API_VERSION'
    ]

    @classmethod
    def get_llm(cls) -> AzureChatOpenAI:
        """
        Lazy-initialize and return the Azure OpenAI LLM client.
        Validates required environment variables and raises a helpful error if missing.
        """
        if cls._llm_instance is not None:
            return cls._llm_instance

        # Check for required env vars
        missing = [var for var in cls._required_env_vars if not os.getenv(var)]
        if missing:
            raise EnvironmentError(
                f"Missing required environment variables for Azure OpenAI: {', '.join(missing)}. "
                f"Please set these in your .env file or shell environment."
            )

        # Read configuration from environment
        azure_endpoint = os.getenv('AZURE_OPENAI_ENDPOINT')
        azure_api_key = os.getenv('AZURE_OPENAI_API_KEY')
        deployment_name = os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME')
        api_version = os.getenv('AZURE_OPENAI_API_VERSION')
        model_name = os.getenv('AZURE_OPENAI_MODEL_NAME', 'gpt-4')
        temperature = float(os.getenv('AZURE_OPENAI_TEMPERATURE', '0.7'))

        try:
            cls._llm_instance = AzureChatOpenAI(
                azure_endpoint=azure_endpoint,
                api_key=azure_api_key,
                api_version=api_version,
                deployment_name=deployment_name,
                model_name=model_name,
                temperature=temperature
            )
        except Exception as e:
            raise RuntimeError(
                f"Failed to initialize Azure OpenAI client: {str(e)}. "
                f"Check your Azure credentials and configuration."
            )

        return cls._llm_instance

    @classmethod
    def set_llm(cls, instance: AzureChatOpenAI) -> None:
        """Allow injecting a custom LLM instance for testing."""
        cls._llm_instance = instance

    @classmethod
    def reset_llm(cls) -> None:
        """Reset the LLM instance (useful for tests)."""
        cls._llm_instance = None

    # Backwards compatibility: use a property-like access
    @property
    def llm(self) -> AzureChatOpenAI:
        """Backwards-compatible access to LLM via Utils.llm (calls get_llm)."""
        return self.get_llm()

    # Also allow class-level access for backwards compatibility
    llm = None  # Will be computed on first access via descriptor or direct call

    def __getattr__(self, name):
        if name == 'llm':
            return self.get_llm()
        raise AttributeError(f"'Utils' object has no attribute '{name}'")