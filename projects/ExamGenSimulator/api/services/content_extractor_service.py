import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import json
import csv
import pandas as pd
import os

def get_topic_div(topic_url: str, api_key: str): 
        endpoint = 'https://api.scrapingant.com/v2/general'
        headers = {'x-api-key': api_key}
        params = {
            'url': topic_url,
            'x-api-key': api_key,
            'browser': False  
        }

        try:
            # Send request to ScrapingAnt
            response = requests.get(endpoint, params=params, headers=headers, timeout=60)
            response.raise_for_status()  
        except requests.exceptions.RequestException as e:
            print(f"ERROR. Request failed: {e}")
            raise

        # Parse HTML using BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')

        # Find the target div by ID
        div = soup.find("div", id="module-unit-content")
        if div:
            return div
        else:
            raise RuntimeError(f"ERROR. <div id='module-unit-content'> not found in: {topic_url}")

class SmartContextExtractor:
    def __init__(self):
        self.get_div_func = get_topic_div

    #Extract the div module-unit-content element from the page using ScrapingAnt API.
    


    #Extract the content inside the div.
    def get_text_from_div(self, div: BeautifulSoup):
        text = div.get_text(separator=" ", strip=True)
        if not text:
            raise ValueError("ERROR. No text found in the div")
        return text


    #Extract all href URLs from <a> tags inside the div, return a list.
    def get_links_from_div(self, div: BeautifulSoup):
        base_url = "https://learn.microsoft.com"

        links = [
            urljoin(base_url, a["href"].strip())
            for a in div.find_all("a", href=True)
        ]

        return links if links else None


    #Extract all data from <img> tags inside the div.
    def get_img_src_from_div(self, div: BeautifulSoup):
        images = div.find_all("img")
        image_data = []

        for index, img in enumerate(images, start=1):
            image_dict = {
                "image_name": f"image{index}",
                "image_src": img.get("src", "").replace("../../", "https://learn.microsoft.com/en-us/training/"),
                "image_alt": img.get("alt", "")
            }
            image_data.append(image_dict)

        return image_data if image_data else None


    #Extract all videos src inside the div, return a list of dicts.
    def get_embedded_video_src_from_div(self, div: BeautifulSoup):
        video_divs = div.find_all("div", class_="embeddedvideo")
        videos = []

        for index, video_div in enumerate(video_divs, start=1):
            iframe = video_div.find("iframe", src=True)
            if iframe:
                video_data = {
                    "name": f"video{index}",
                    "video_src": iframe["src"]
                }
                videos.append(video_data)

        return videos if videos else None

    #Create a dictionary with all data 
    def get_all_content_from_course_into_dict(self, course_json: dict, api_key: str):
        results = []

        course_name = course_json.get("course", "")

        for module in course_json.get("modules", []):
            module_name = module.get("name", "")
            print(f"Module name: {module_name}")
            for unit in module.get("units", []):
                unit_name = unit.get("name", "")
                print(f"Unit name: {unit_name}")
                for topic in unit.get("topics", []):
                    topic_name = topic.get("name", "")
                    topic_url = topic.get("url", "")
                    print(f"topic Name: {topic_name}")

                    try:
                        if ("module assessment" not in topic_name.lower()):
                            #div = get_topic_div(topic_url, api_key)
                            div = self.get_div_func(topic_url, api_key)
                            text = self.get_text_from_div(div)
                            videos = self.get_embedded_video_src_from_div(div)

                            #Check if it's an exercise page
                            if("exercise" in topic_name.lower()):
                                temp_links = self.get_links_from_div(div)
                                links = temp_links[:-1] if len(temp_links) > 1 else None
                                exercise = temp_links[-1] #Add ["url"] if you're using a dict
                                images = None
                            else:                    
                                links = self.get_links_from_div(div)
                                images = self.get_img_src_from_div(div)
                                exercise = None

                            # Combinar datos contextuales + extraídos
                            topic_data = {
                                "course": course_name,
                                "module": module_name,
                                "unit": unit_name,
                                "topic": topic_name,
                                "text": text,
                                "links": links,
                                "images": images,
                                "videos": videos,
                                "exercise": exercise 
                            }

                            results.append(topic_data)

                    except Exception as e:
                        print(f"ERROR. Failed to process topic: {topic_name} | URL: {topic_url} | {e}")
                        continue

        return results

    # Create DataFrame using all content
    def createDataFrame(data):
        return pd.DataFrame(data)

    # Create CSV file using all content
    def createCSVFile(data, fileName: str):
        # Write csv file
        with open(f"../Files/{fileName}.csv", mode='w', newline='', encoding='utf-8') as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
