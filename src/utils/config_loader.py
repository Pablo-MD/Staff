import os
import yaml
from pathlib import Path
from typing import Any, Dict, Optional

class ConfigManager:
    """Centralized configuration manager for the Golden Cloud project."""
    
    _instance = None
    _config: Dict[str, Any] = {}

    def __new__(cls, config_path: Optional[str] = None):
        if cls._instance is None:
            cls._instance = super(ConfigManager, cls).__new__(cls)
            cls._instance._load_config(config_path)
        return cls._instance

    def _load_config(self, config_path: Optional[str] = None):
        """Loads configuration from a YAML file."""
        if not config_path:
            # Default to config.yaml in the parent directory of src
            config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "config.yaml")
        
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                self._config = yaml.safe_load(f)
        except Exception as e:
            print(f"Error loading configuration from {config_path}: {e}")
            self._config = {}

    def get(self, key: str, default: Any = None) -> Any:
        """Retrieve a configuration value using dot notation (e.g., 'document_ai.location')."""
        keys = key.split('.')
        value = self._config
        try:
            for k in keys:
                value = value[k]
            return value
        except (KeyError, TypeError):
            return default

    @property
    def all(self) -> Dict[str, Any]:
        """Returns the entire configuration dictionary."""
        return self._config

# Example usage:
# config = ConfigManager()
# location = config.get("document_ai.location")
