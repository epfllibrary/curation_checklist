#!/usr/bin/env python3
"""
Zenodo Community Submission Checker [Claude.AI version]

This script checks the Zenodo API for new submission requests to a community,
downloads files, performs validation checks, logs submissions, and cleans up.
"""


"""
Here's what the script does:
* Key Features: *
- API Integration: Connects to Zenodo API to fetch community submission requests
- File Downloads: Downloads all files associated with each submission request
- Validation Checks: Performs dummy checks including:

    - File existence and readability
    - File size validation (must be > 0 and < 100MB)
    - MD5 hash calculation
    - File type detection


- Logging: Comprehensive logging to both file and console
- State Management: Tracks processed submissions to avoid reprocessing
- Cleanup: Automatically removes temporary download directories

* Configuration: *
Before using the script, you need to:

Replace COMMUNITY_ID with your actual Zenodo community identifier
Replace ACCESS_TOKEN with your Zenodo API access token
Install required dependencies:

pip install requests


* Usage: *
python zenodo_checker.py

"""

import os
import sys
import json
import logging
import requests
import hashlib
import tempfile
import shutil
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse


class ZenodoSubmissionChecker:
    """Handle Zenodo community submission checking and processing."""

    def __init__(
        self,
        community_id: str,
        access_token: str,
        log_file: str = "zenodo_submissions.log",
        processed_file: str = "processed_submissions.json",
    ):
        """
        Initialize the submission checker.

        Args:
            community_id: Zenodo community identifier
            access_token: Zenodo API access token
            log_file: Path to log file
            processed_file: Path to file storing processed submission IDs
        """
        self.community_id = community_id
        self.access_token = access_token
        self.log_file = log_file
        self.processed_file = processed_file

        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(levelname)s - %(message)s",
            handlers=[logging.FileHandler(log_file), logging.StreamHandler(sys.stdout)],
        )
        self.logger = logging.getLogger(__name__)

        # Zenodo API base URL
        self.api_base = "https://zenodo.org/api"

        # Load previously processed submissions
        self.processed_submissions = self._load_processed_submissions()

        # Create temporary directory for downloads
        self.temp_dir = tempfile.mkdtemp(prefix="zenodo_downloads_")
        self.logger.info(f"Using temporary directory: {self.temp_dir}")

    def _load_processed_submissions(self) -> set:
        """Load previously processed submission IDs from file."""
        if os.path.exists(self.processed_file):
            try:
                with open(self.processed_file, "r") as f:
                    data = json.load(f)
                    return set(data.get("processed_ids", []))
            except (json.JSONDecodeError, IOError) as e:
                self.logger.warning(f"Could not load processed submissions: {e}")
        return set()

    def _save_processed_submissions(self):
        """Save processed submission IDs to file."""
        try:
            data = {
                "processed_ids": list(self.processed_submissions),
                "last_updated": datetime.now().isoformat(),
            }
            with open(self.processed_file, "w") as f:
                json.dump(data, f, indent=2)
        except IOError as e:
            self.logger.error(f"Could not save processed submissions: {e}")

    def get_community_requests(self) -> List[Dict[Any, Any]]:
        """
        Fetch submission requests for the community.

        Returns:
            List of submission request dictionaries
        """
        url = f"{self.api_base}/communities/{self.community_id}/requests"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()

            data = response.json()
            requests_list = data["hits"].get("hits", [])
            print(data)

            self.logger.info(f"Found {len(requests_list)} submission requests")
            return requests_list

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error fetching community requests: {e}")
            return []

    def get_record_files(self, record_id: str) -> List[Dict[str, Any]]:
        """
        Get file information for a specific record.

        Args:
            record_id: Zenodo record ID

        Returns:
            List of file dictionaries with download URLs
        """
        url = f"{self.api_base}/records/{record_id}"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()

            data = response.json()
            files = data.get("files", [])

            self.logger.info(f"Record {record_id} has {len(files)} files")
            return files

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error fetching record files for {record_id}: {e}")
            return []

    def download_file(
        self, file_info: Dict[str, Any], download_dir: str
    ) -> Optional[str]:
        """
        Download a file from Zenodo.

        Args:
            file_info: File information dictionary from Zenodo API
            download_dir: Directory to download file to

        Returns:
            Path to downloaded file or None if failed
        """
        try:
            download_url = file_info.get("links", {}).get("self")
            filename = file_info.get("key", "unknown_file")

            if not download_url:
                self.logger.error(f"No download URL found for file {filename}")
                return None

            file_path = os.path.join(download_dir, filename)

            headers = {"Authorization": f"Bearer {self.access_token}"}

            self.logger.info(f"Downloading {filename}...")
            response = requests.get(download_url, headers=headers, stream=True)
            response.raise_for_status()

            with open(file_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            self.logger.info(f"Downloaded {filename} to {file_path}")
            return file_path

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error downloading file {filename}: {e}")
            return None
        except IOError as e:
            self.logger.error(f"Error writing file {filename}: {e}")
            return None

    def perform_file_check(self, file_path: str) -> Dict[str, Any]:
        """
        Perform dummy checks on a downloaded file.

        Args:
            file_path: Path to the file to check

        Returns:
            Dictionary with check results
        """
        checks = {
            "file_path": file_path,
            "filename": os.path.basename(file_path),
            "exists": False,
            "size_bytes": 0,
            "size_mb": 0.0,
            "md5_hash": None,
            "file_type": None,
            "is_readable": False,
            "checks_passed": False,
        }

        try:
            if os.path.exists(file_path):
                checks["exists"] = True

                # Get file size
                size_bytes = os.path.getsize(file_path)
                checks["size_bytes"] = size_bytes
                checks["size_mb"] = round(size_bytes / (1024 * 1024), 2)

                # Get file type from extension
                checks["file_type"] = Path(file_path).suffix.lower()

                # Check if file is readable and calculate MD5
                try:
                    with open(file_path, "rb") as f:
                        checks["is_readable"] = True

                        # Calculate MD5 hash
                        md5_hash = hashlib.md5()
                        for chunk in iter(lambda: f.read(4096), b""):
                            md5_hash.update(chunk)
                        checks["md5_hash"] = md5_hash.hexdigest()

                except IOError:
                    checks["is_readable"] = False

                # Dummy validation rules
                checks_passed = (
                    checks["exists"]
                    and checks["is_readable"]
                    and checks["size_bytes"] > 0
                    and checks["size_bytes"] < 100 * 1024 * 1024  # Less than 100MB
                )
                checks["checks_passed"] = checks_passed

                status = "PASSED" if checks_passed else "FAILED"
                self.logger.info(
                    f"File check {status}: {checks['filename']} "
                    f"({checks['size_mb']} MB)"
                )

        except Exception as e:
            self.logger.error(f"Error checking file {file_path}: {e}")

        return checks

    def process_submission_request(self, request_info: Dict[str, Any]) -> bool:
        """
        Process a single submission request.

        Args:
            request_info: Submission request information

        Returns:
            True if processing was successful
        """
        try:
            request_id = request_info.get("id")
            record_id = request_info.get("topic", {}).get("record")

            if not record_id:
                self.logger.warning(f"No record ID found in request {request_id}")
                return False

            self.logger.info(
                f"Processing submission request {request_id} for record {record_id}"
            )

            # Create subdirectory for this submission
            submission_dir = os.path.join(self.temp_dir, f"submission_{request_id}")
            os.makedirs(submission_dir, exist_ok=True)

            # Get files for the record
            files = self.get_record_files(record_id)

            if not files:
                self.logger.warning(f"No files found for record {record_id}")
                return False

            # Process each file
            all_checks_passed = True
            file_results = []

            for file_info in files:
                # Download file
                file_path = self.download_file(file_info, submission_dir)

                if file_path:
                    # Perform checks
                    check_results = self.perform_file_check(file_path)
                    file_results.append(check_results)

                    if not check_results["checks_passed"]:
                        all_checks_passed = False
                else:
                    all_checks_passed = False

            # Log submission processing results
            self.logger.info(
                f"Submission {request_id} processing complete. "
                f"Files processed: {len(file_results)}, "
                f"All checks passed: {all_checks_passed}"
            )

            # Mark as processed
            self.processed_submissions.add(request_id)

            return True

        except Exception as e:
            self.logger.error(f"Error processing submission request: {e}")
            return False

    def cleanup_downloads(self):
        """Remove temporary download directory and all files."""
        try:
            if os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir)
                self.logger.info(f"Cleaned up temporary directory: {self.temp_dir}")
        except OSError as e:
            self.logger.error(f"Error cleaning up temporary directory: {e}")

    def run(self):
        """Main execution method."""
        try:
            self.logger.info(
                f"Starting Zenodo submission check for community: {self.community_id}"
            )

            # Get community submission requests
            requests_list = self.get_community_requests()

            if not requests_list:
                self.logger.info("No submission requests found")
                return

            # Filter out already processed requests
            new_requests = [
                req
                for req in requests_list
                if req.get("id") not in self.processed_submissions
            ]

            self.logger.info(
                f"Found {len(new_requests)} new submission requests to process"
            )

            # Process each new request
            processed_count = 0
            for request_info in new_requests:
                if self.process_submission_request(request_info):
                    processed_count += 1
                self.cleanup_downloads()

            self.logger.info(
                f"Successfully processed {processed_count}/{len(new_requests)} requests"
            )

            # Save processed submission IDs
            self._save_processed_submissions()

        except KeyboardInterrupt:
            self.logger.info("Process interrupted by user")
        except Exception as e:
            self.logger.error(f"Unexpected error in main execution: {e}")
        finally:
            # Always cleanup downloads
            self.cleanup_downloads()


def main():
    """Main entry point."""
    # Configuration - replace with your actual values
    COMMUNITY_ID = "3c1383da-d7ab-4167-8f12-4d8aa0cc637f"  # e.g., "mycommunity"
    ACCESS_TOKEN = "muoceEEhK6WyRyFVUZxEkjFqGbEFq5cVQCBrxgCG9UvDAM5xVBPynDbknsNX"  # Your Zenodo API token

    # Validate configuration
    if (
        COMMUNITY_ID == "your-community-id"
        or ACCESS_TOKEN == "your-zenodo-access-token"
    ):
        print(
            "Error: Please update COMMUNITY_ID and ACCESS_TOKEN with your actual values"
        )
        sys.exit(1)

    # Create and run checker
    checker = ZenodoSubmissionChecker(
        community_id=COMMUNITY_ID,
        access_token=ACCESS_TOKEN,
        log_file="zenodo_submissions.log",
        processed_file="processed_submissions.json",
    )

    checker.run()


if __name__ == "__main__":
    main()
