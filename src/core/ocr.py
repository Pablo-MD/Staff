import os
import yaml
from abc import ABC, abstractmethod
from typing import List, Any

from langchain_google_community import DocAIParser
from langchain_core.document_loaders.blob_loaders import Blob
from langchain_core.documents import Document as LangchainDocument

from src.settings import (
    PROJECT_ID, DOC_AI_PROCESSOR_ID, DOC_AI_LOCATION                
)

class DocumentLoader(ABC):
    """Abstract base class for loading documents."""
    
    @abstractmethod
    def load(self, file_path: str) -> Any:
        """Load a document from a file path."""
        pass

class GCSBlobLoader(DocumentLoader):
    """Concrete implementation for loading documents from GCS as Blobs."""
    
    def __init__(self, gcs_uri: str):
        self.gcs_uri = gcs_uri
        # Parse gs://bucket-name/object-path
        if not gcs_uri.startswith("gs://"):
            raise ValueError("GCS URI must start with gs://")
        self.bucket_name = gcs_uri[5:].split('/')[0]
        self.blob_name = '/'.join(gcs_uri[5:].split('/')[1:])
    
    def load(self, file_path: str = None) -> Blob:
        """Load a document from GCS as a Langchain Blob."""
        from google.cloud import storage
        client = storage.Client(project=PROJECT_ID)
        bucket = client.bucket(self.bucket_name)
        blob = bucket.blob(self.blob_name)
        
        # Download blob content as bytes
        content = blob.download_as_bytes()
        return Blob(data=content, path=self.gcs_uri)

class DocumentParser(ABC):
    """Abstract base class for parsing documents."""
    
    @abstractmethod
    def parse(self, source: Any) -> List[LangchainDocument]:
        """Parse a document source into Langchain Documents."""
        pass

class GoogleDocAIProcessor(DocumentParser):
    """Concrete implementation of DocumentParser using Google Document AI."""
    
    def __init__(self):
        self.project_id = PROJECT_ID
        if not self.project_id:
            raise ValueError("GOOGLE_PROJECT_ID environment variable not set")
            
        self.location = DOC_AI_LOCATION
        self.processor_id = DOC_AI_PROCESSOR_ID
        # self.gcs_output_path = self.config["document_ai"]["gcs_output_path"]
        
        self.processor_name = f"projects/{self.project_id}/locations/{self.location}/processors/{self.processor_id}"
        
        self.parser = DocAIParser(
            location=self.location,
            processor_name=self.processor_name,
            # gcs_output_path=self.gcs_output_path    
        )

    def parse(self, blob: Blob) -> List[LangchainDocument]:
        """Parse a Blob using Google Document AI."""
        return self.parser.parse(blob)

class DocumentAIService:
    """Service class to orchestrate document loading and parsing."""
    
    def __init__(self, loader: DocumentLoader, parser: DocumentParser):
        self.loader = loader
        self.parser = parser
        
    def process_document(self, file_path: str) -> List[LangchainDocument]:
        """Load and parse a document from a file path."""
        source = self.loader.load(file_path)
        return self.parser.parse(source)

# Convenience function for backward compatibility or simple usage
def document_ai_ocr(file_path: str) -> List[LangchainDocument]:
    """Legacy-style function to perform OCR using Google Document AI."""
    loader = BlobDocumentLoader()
    parser = GoogleDocAIProcessor()
    service = DocumentAIService(loader, parser)
    return service.process_document(file_path)

def document_ai_ocr_from_gcs(gcs_uri: str) -> List[LangchainDocument]:
    """Perform OCR using Google Document AI from a GCS URI."""
    loader = GCSBlobLoader(gcs_uri)
    parser = GoogleDocAIProcessor()
    service = DocumentAIService(loader, parser)
    return service.process_document(gcs_uri)


















