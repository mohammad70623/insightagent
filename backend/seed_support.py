#!/usr/bin/env python
"""
InsightAgent Enterprise AI Engine
Static PDF Support System Seeding Script (seed_support.py)

This script parses the official platform manual PDF ("insightAgent support document.pdf")
and seeds it into a dedicated, isolated collection ("system_support") within Qdrant.
It enforces complete structural boundaries (isolation/firewalls) to prevent context
contamination between system support docs and tenant-specific uploaded files.

Author: Senior Backend & AI Data Engineer
"""

import os
import sys
import uuid
import argparse
import logging
from typing import List, Dict, Any

# Load environment variables
from dotenv import load_dotenv

# Clean & Modern Imports at the Very Top (no try-excepts for core dependencies)
import pdfplumber
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("seed_support")

# Attempt to load from current and parent dirs
for env_path in [".env", "backend/.env", "../.env"]:
    if os.path.exists(env_path):
        load_dotenv(env_path)
        logger.info(f"Loaded environment variables from: {env_path}")
        break


def parse_arguments():
    """Parse CLI arguments for flexible execution configurations."""
    parser = argparse.ArgumentParser(
        description="Seed static platform diagnostics & FAQ PDF into an isolated Qdrant collection."
    )
    parser.add_argument(
        "--provider",
        type=str,
        choices=["fastembed", "openai"],
        default=os.getenv("EMBEDDING_PROVIDER", "fastembed"),
        help="Embedding provider framework to use. Options: 'fastembed' or 'openai' (default: fastembed)."
    )
    parser.add_argument(
        "--pdf-path",
        type=str,
        default=None,
        help="Override path to 'insightAgent support document.pdf'."
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="Number of vector points to upsert in a single batch (default: 32)."
    )
    return parser.parse_args()


def locate_support_pdf(override_path: str = None) -> str:
    """
    Locates the platform manual PDF from multiple candidate directories.
    Handles relative execution contexts gracefully.
    """
    filename = "insightAgent support document.pdf"
    if override_path:
        if os.path.exists(override_path):
            return override_path
        else:
            raise FileNotFoundError(f"Overridden PDF path not found: {override_path}")

    # Standard candidate directories in the project tree
    candidate_paths = [
        os.path.join("assets", filename),
        os.path.join("app", "assets", filename),
        os.path.join("backend", "app", "assets", filename),
        os.path.join("..", "backend", "app", "assets", filename),
        # Root fallback
        filename
    ]

    for path in candidate_paths:
        if os.path.exists(path):
            logger.info(f"Successfully located support PDF at: {os.path.abspath(path)}")
            return path

    raise FileNotFoundError(
        f"CRITICAL ERROR: Could not locate '{filename}' in any asset directory.\n"
        f"Checked paths: {[os.path.abspath(p) for p in candidate_paths]}"
    )


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts raw text from the target PDF using pdfplumber with a pypdf fallback.
    Maintains layout matrix alignment.
    """
    text_content = ""
    
    # Try pdfplumber first (retains columns and tabular layouts)
    try:
        logger.info("Extracting PDF content using pdfplumber layout engine...")
        with pdfplumber.open(pdf_path) as pdf:
            pages_text = []
            for page in pdf.pages:
                page_text = page.extract_text(layout=True)
                if page_text:
                    pages_text.append(page_text)
            text_content = "\n".join(pages_text)
    except Exception as e:
        logger.warning(f"pdfplumber execution failed ({str(e)}). Falling back to pypdf...")

    # Fallback to pypdf if pdfplumber is unavailable or returns blank
    if not text_content.strip():
        try:
            logger.info("Extracting PDF content using pypdf reader...")
            reader = PdfReader(pdf_path)
            pages_text = [page.extract_text() for page in reader.pages if page.extract_text()]
            text_content = "\n".join(pages_text)
        except Exception as e:
            logger.critical(f"CRITICAL: pypdf reader also failed: {str(e)}")
            raise

    if not text_content.strip():
        raise ValueError("CRITICAL ERROR: Extracted text is empty or could not be decoded.")

    return text_content


def get_embedding_generator(provider: str):
    """
    Generates embedding vectors for list of strings using the selected provider.
    Provides standard SentenceTransformers as fallback if libraries are missing.
    """
    provider = provider.lower()
    
    if provider == "openai":
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            logger.error("OPENAI_API_KEY environment variable is missing.")
            raise ValueError("OPENAI_API_KEY must be set when choosing 'openai' embedding provider.")
            
        try:
            # Langchain OpenAI Embeddings
            try:
                from langchain_openai import OpenAIEmbeddings
                model = OpenAIEmbeddings(openai_api_key=openai_key)
            except ImportError:
                from langchain_community.embeddings import OpenAIEmbeddings
                model = OpenAIEmbeddings(openai_api_key=openai_key)
            
            logger.info("Initialized OpenAI text-embedding-ada-002/text-embedding-3-small provider.")
            return lambda texts: model.embed_documents(texts), 1536
        except Exception as e:
            logger.critical(f"Failed to initialize OpenAI Embeddings: {str(e)}")
            sys.exit(1)
            
    else:
        # Default local embeddings
        try:
            from fastembed import TextEmbedding
            logger.info("Initializing FastEmbed Local Embeddings Engine...")
            model = TextEmbedding()
            # FastEmbed outputs a generator of numpy arrays, convert to list of floats
            return lambda texts: [list(vec) for vec in model.embed(texts)], 384
        except ImportError:
            logger.warning("fastembed is not installed. Trying sentence-transformers fallback...")
            try:
                from sentence_transformers import SentenceTransformer
                model_name = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
                logger.info(f"Initializing SentenceTransformer model: {model_name}...")
                model = SentenceTransformer(model_name)
                return lambda texts: model.encode(texts).tolist(), 384
            except ImportError:
                try:
                    from langchain_community.embeddings import FastEmbedEmbeddings
                    logger.info("Initializing LangChain FastEmbedEmbeddings wrapper...")
                    model = FastEmbedEmbeddings()
                    return lambda texts: model.embed_documents(texts), 384
                except Exception as e:
                    logger.critical(f"CRITICAL: Failed to load local embedding models: {str(e)}")
                    sys.exit(1)


def seed_vector_store():
    # 1. Parse Arguments
    args = parse_arguments()

    # 2. Locate and extract PDF
    try:
        pdf_path = locate_support_pdf(args.pdf_path)
        raw_text = extract_text_from_pdf(pdf_path)
        logger.info(f"Extracted {len(raw_text)} raw characters from PDF manual.")
    except Exception as err:
        logger.critical(f"Failed to load or parse PDF: {str(err)}")
        sys.exit(1)

    # 3. Chunk raw text
    # Preserve layout and context using size=800, overlap=100
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
        length_function=len
    )
    chunks = splitter.split_text(raw_text)
    total_chunks = len(chunks)
    logger.info(f"Text divided into {total_chunks} chunks using RecursiveCharacterTextSplitter.")

    # 4. Initialize Qdrant Client using Environment Config
    qdrant_host = os.getenv("QDRANT_HOST")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    qdrant_url = os.getenv("QDRANT_URL") or os.getenv("VECTOR_DB_URL")

    logger.info("Initializing Qdrant Connection...")
    try:
        if qdrant_host:
            client = QdrantClient(host=qdrant_host, api_key=qdrant_api_key)
        elif qdrant_url:
            client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
        else:
            # Local Dev Fallback
            client = QdrantClient(url="http://localhost:6333", api_key=qdrant_api_key)
        
        # Test connection availability
        client.get_collections()
        logger.info("Connection to Qdrant Vector Warehouse verified.")
    except Exception as e:
        logger.critical(f"Qdrant DB unreachable. Ensure it is running. Error: {str(e)}")
        sys.exit(1)

    # 5. Handle Vector dimension and Collection recreated isolations
    collection_name = "system_support"
    embed_fn, vector_size = get_embedding_generator(args.provider)

    try:
        if client.collection_exists(collection_name=collection_name):
            logger.info(f"Collection '{collection_name}' already exists. Recreating to purge dirty states...")
            client.delete_collection(collection_name=collection_name)

        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
        )
        logger.info(f"Collection '{collection_name}' created successfully (Dimensions: {vector_size}, Metric: COSINE).")
    except Exception as e:
        logger.critical(f"Failed to reset/initialize collection '{collection_name}': {str(e)}")
        sys.exit(1)

    # 6. Embed and Upsert in batch sizes of 32
    logger.info(f"Beginning batched vector seeding (Batch Size: {args.batch_size})...")
    points_upserted = 0
    
    for i in range(0, total_chunks, args.batch_size):
        batch_chunks = chunks[i : i + args.batch_size]
        try:
            batch_vectors = embed_fn(batch_chunks)
        except Exception as e:
            logger.critical(f"Embedding generation crashed during batch {i // args.batch_size + 1}: {str(e)}")
            sys.exit(1)

        points = []
        for j, text in enumerate(batch_chunks):
            point_id = str(uuid.uuid4())
            # Inject static metadata firewall parameters
            payload = {
                "text": text,
                "source": "insightAgent support document",
                "type": "platform_diagnostics",
                "is_static_faq": True
            }
            points.append(PointStruct(
                id=point_id,
                vector=batch_vectors[j],
                payload=payload
            ))

        try:
            client.upsert(collection_name=collection_name, points=points)
            points_upserted += len(points)
            logger.info(f"Synced Batch {i // args.batch_size + 1}: Upserted {points_upserted}/{total_chunks} vectors.")
        except Exception as e:
            logger.critical(f"Upsert transaction rejected by Qdrant: {str(e)}")
            sys.exit(1)

    # 7. Print Seeding Completion Dashboard Matrix
    dashboard = f"""
================================================================================
                    SEEDING COMPLETED: ISOLATION STATUS REPORT
================================================================================
  [PARAMETER]                       [VALUE]
 ──────────────────────────────────────────────────────────────────────────────
  Target Collection Name           : {collection_name}
  Embedding Provider Model         : {args.provider.upper()} (Dim: {vector_size})
  Total Chunks Processed           : {total_chunks}
  Upserted Vector Count            : {points_upserted}
  Metadata Isolation Firewall     : ACTIVE (is_static_faq = True)
  Tenant Data Coexistence          : ISOLATED (Separated by Dedicated Collection)
 ──────────────────────────────────────────────────────────────────────────────
  STATUS                           : SUCCESSFUL
================================================================================
  CRITICAL ISO-LOCK ACTIVE: Static support vectors successfully isolated 
  from dynamic user document layers.
================================================================================
"""
    print(dashboard)


if __name__ == "__main__":
    seed_vector_store()
