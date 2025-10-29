from textblob import TextBlob

def analyze_sentiment(text):
    """
    Analyze the sentiment of text using TextBlob.
    Returns a score between -1 (negative) and +1 (positive).
    """
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    label = "positive" if polarity > 0 else "negative" if polarity < 0 else "neutral"

    return {
        "text": text,
        "sentiment": label,
        "score": round(polarity, 3)
    }
