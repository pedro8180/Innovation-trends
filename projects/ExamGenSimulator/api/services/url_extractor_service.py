import json
import requests
from bs4 import BeautifulSoup
import os



class UrlExtractor:
    base_path_url = "https://learn.microsoft.com/en-us/training/"
    endpoint = "https://api.scrapingant.com/v2/general" #API

    def __init__(self, api_key: str):
        self.api_key = api_key

    # This code is for load replacements
    def __init__(self, api_key: str, replacements_file: str = "../Files/replacements.json"):
        self.api_key = api_key
        self.replacements = self.load_replacements(replacements_file)

    #Load replacements. There are special cases where the url extracted is wrong
    def load_replacements(self, file_path: str):
        if not os.path.exists(file_path):
            print(f"ERRO. Replacement file not found: {file_path}. Using an empty dictionary.")
            return {}
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data

    #Get HTML code
    def get_html(self, url: str):

        headers = {'x-api-key': self.api_key}
        params = {
            'url': url,
            'x-api-key': self.api_key,
            'browser': False  
        }

        try:
            # Send request to ScrapingAnt
            response = requests.get(self.endpoint, params=params, headers=headers, timeout=300)
            response.raise_for_status()  
            return BeautifulSoup(response.text, 'html.parser')
        except requests.exceptions.RequestException as e:
            print(f"ERROR. Fetching failed {url}: {e}")
            raise

    #Extract the title for all modules    
    def get_title(self, url: str, soup: BeautifulSoup):
        tag = soup.find('h1', class_='title')
        if not tag:
            raise ValueError(f"ERROR. Missing <h1 class='title'> tag {url}")
        text = tag.get_text(strip=True)
        if not text:
            raise ValueError(f"ERROR. Missing value in <h1 class='title'> tag {url}")
        
        return text

    #Extract module URLs from meta tags
    def extract_module_urls(self, course_soup: BeautifulSoup):
        if course_soup is None:
            raise ValueError("ERROR. The 'course_soup' object cannot be None.")

        metas = course_soup.find_all('meta', attrs={'name': 'learn_item'})
        if not metas:
            raise ValueError("ERROR. No <meta name='learn_item'> tags found in the HTML.")

        urls = []
        for learn in metas:
            content_value = learn.get('content')
            if not content_value:
                raise ValueError("ERROR. A <meta name='learn_item'> tag is missing the 'content' attribute.")

            if '.' not in content_value:
                raise ValueError(f"ERROR. Invalid content format in meta tag: '{content_value}'")

            last_part = content_value.split('.')[-1]
            # Apply replacements from the loaded JSON
            module_path = self.replacements.get(last_part, last_part)
            urls.append(self.base_path_url + "paths/" + module_path)

        return urls

    #Extract unit URLs from <a> links inside a module page.
    def extract_unit_urls(self, module_name : str, module_soup: BeautifulSoup):
        print(module_name)
        if module_soup is None:
            raise ValueError(f"ERROR. The 'module_soup' object cannot be None. Module: {module_name}")

        links = module_soup.find_all('a', href=True)
        if not links:
            raise ValueError(f"ERROR. No <a href='...'> links found in the module page. Module: {module_name}")

        urls = []
        for link in links:
            href = link.get('href')

            if not href:
                raise ValueError(f"ERROR. A link is missing the 'href' attribute. Link: {link}")

            if href.startswith('../../modules/'):
                unit_url = self.base_path_url + href.replace('../../', '')
                if unit_url not in urls:
                    urls.append(unit_url)

        if not urls:
            print(module_soup)
            raise ValueError(f"ERROR. No valid unit URLs found in the module page. Module: {module_name}")

        return urls


    #Extracts the unit name and its topics (titles and urls) from a unit page.
    def extract_data_from_unit(self, unit_url: str):
        if not unit_url:
            raise ValueError("ERROR. The 'unit_url' parameter cannot be empty.")

        # Fetch the HTML of the unit
        unit_soup = self.get_html(unit_url)
        if unit_soup is None:
            raise ValueError(f"ERROR. Failed to retrieve HTML from: {unit_url}")

        # Extract unit name
        title_tag = unit_soup.find('h1')
        if title_tag is None or not title_tag.text.strip():
            raise ValueError(f"ERROR. Unit title not found in the page: {unit_url}")
        unit_name = title_tag.text.strip()

        # Extract topics
        topic_links = unit_soup.find_all('a', class_='unit-title', href=True)
        if not topic_links:
            raise ValueError(f"ERROR. No topics found in the unit page: {unit_url}")

        topics = []
        for topic_link in topic_links:
            topic_name = topic_link.text.strip()
            if not topic_name:
                raise ValueError(f"ERROR. A topic in {unit_url} has no name.")

            topic_url = topic_link['href']
            if not topic_url:
                raise ValueError(f"ERROR. A topic in {unit_url} has no href.")

            # Make relative URLs absolute
            if not topic_url.startswith('http'):
                topic_url = unit_url.rstrip('/') + '/' + topic_url.lstrip('/')

            topics.append({'name': topic_name, 'url': topic_url})

        return {'name': unit_name, 'url': unit_url, 'topics': topics}
    
    #Scrapes the entire course, including modules, units, and topics.
    def scrape_course(self, course_url: str):
        # Fetch course HTML
        course_soup = self.get_html(course_url)

        # Extract course title
        course_name = self.get_title(course_url, course_soup)

        # Extract module URLs
        modules_urls = self.extract_module_urls(course_soup)

        print(modules_urls)

        course_data = {"course": course_name, "modules": []}

        for module_url in modules_urls:
            # Fetch module HTML
            module_soup = self.get_html(module_url)

            # Extract module title
            module_name = self.get_title(module_url, module_soup)

            #Extract unit URLs
            unit_urls = self.extract_unit_urls(module_name, module_soup)

            # Extract unit data
            units = [self.extract_data_from_unit(unit_url) for unit_url in unit_urls]

            course_data["modules"].append({
                "name": module_name,
                "url": module_url,
                "units": units
            })

        # Convert dict to JSON string
<<<<<<< HEAD
        return course_data
=======
        return course_data
>>>>>>> feature/updateURLExtractor
