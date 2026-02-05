import logging
import sys
import os
from logging.handlers import RotatingFileHandler

log_dir = "logs"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

def setup_logger(name="smartcart_ml"):
    # 1. Force Windows Console to accept Emojis (The Fix)
    if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding='utf-8')

    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    # 2. Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # 3. File Handler (with UTF-8 encoding explicit)
    file_handler = RotatingFileHandler(
        os.path.join(log_dir, "ml_service.log"), 
        maxBytes=10*1024*1024, 
        backupCount=5,
        encoding="utf-8"  # <--- Critical for saving emojis to file
    )
    file_handler.setFormatter(formatter)

    if not logger.handlers:
        logger.addHandler(console_handler)
        logger.addHandler(file_handler)

    return logger

logger = setup_logger()