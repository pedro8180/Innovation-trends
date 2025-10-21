import os
import re
import requests
from bs4 import BeautifulSoup
from langchain_community.document_loaders import ScrapingAntLoader

class Extractor:
    def __init__(self):
        self.endpoint = 'https://api.scrapingant.com/v2/general'

    def extract_content(self, url, api_key):
        loader = ScrapingAntLoader(
            urls=[url],
            api_key=api_key,
            continue_on_failure=True
        )
        documents = loader.load()
        pattern = 'Ask Learn Ask Learn(.*?)## Next unit'
        match = re.search(pattern, documents[0].page_content, re.DOTALL)
        clean_text = match.group(1).strip()
        return clean_text


    def create_json_document(self, cert_data, api_key):
        output = []

        for module in cert_data['modules']:
            for unit in module['units']:
                for topic in unit['topics']:
                    url = topic['url']
                    topic_content = self.extract_content(url, api_key)
                    output.append(
                        {   
                            "topic_name": topic['name'],
                            "content": url
                        }
                    )

                output.append(
                    {
                        "unit_name": unit['name']
                    }
                )
            
            output.append(
                {
                    "module": module['name']
                }
            )
       
        return output
        