import wikipediaapi


def get_wiki_summary(location_name: str) -> dict:
    """
    Fetch a brief summary and URL of the location from Wikipedia.
    """
    # Wikipedia API requires a descriptive User-Agent
    user_agent = "WeatherApp/1.0 (pmaccelerator-assessment@example.com)"
    # Split the Nominatim display_name into parts
    # e.g., "Central and Western District, Hong Kong Island, Hong Kong, China"
    parts = [p.strip() for p in location_name.split(",")]
    
    wiki = wikipediaapi.Wikipedia(
        user_agent=user_agent,
        language="en",
    )

    try:
        # Try each part of the address (left to right) until we find a valid page
        for part in parts:
            if not part:
                continue
                
            page = wiki.page(part)
            
            # Check if page exists and has a meaningful summary (not just a disambiguation)
            if page.exists() and page.summary and len(page.summary) > 50:
                return {
                    "title": page.title,
                    "summary": page.summary[:1500],
                    "url": page.fullurl,
                }
                
        # If no specific part works, return empty
        return {"title": None, "summary": None, "url": None}
        
    except Exception:
        # Non-critical — return empty if Wikipedia fails
        return {"title": None, "summary": None, "url": None}
