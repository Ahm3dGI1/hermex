from typing import Union

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi import Body
from fastapi.middleware.cors import CORSMiddleware

import uuid

from utils.youtube_utils import download_audio

from utils.openai import stt
from utils.openai import generate_ai_questions_and_summary

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://hermex-gamma.vercel.app/"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_transcript_segments(segments: dict) -> dict:
    return [
        {
            "start": round(segment.start, 2),
            "end": round(segment.end, 2),
            "text": segment.text.strip()
        }
        for segment in segments
    ]


class PreprocessRequest(BaseModel):
    youtube_link: str

@app.post("/api/preprocess")
def preprocess_video(data: PreprocessRequest):
    session_id = str(uuid.uuid4())
    
    audio_file = download_audio(data.youtube_link, session_id)

    transcript_verbose = stt(audio_file)
    transcript_text = transcript_verbose.text.strip()
    transcript_segments = clean_transcript_segments(transcript_verbose.segments)

    ai_response = generate_ai_questions_and_summary(transcript_text, transcript_segments)

    return {
        "session_id": session_id,
        "transcript": transcript_text,
        "ai_insights": ai_insights
    }


text= "Hey, I'm Adam Wathen and I'm the guy who created Tailwind CSS. Build UIs that don't suck is a little video series I've put together that walks through some of the coolest tricks that I've picked up over the years building hundreds of UI components that not only needed to look great, but they also need to work perfectly on different devices, adapt to different content, be accessible to keyboard and screen reader users, and just generally not be subtly broken to anyone with an eye for detail. Let me walk you through a quick example of the sort of thing I'm talking about. So here I've got a little demo of sort of a blog site, right, with a list of articles that this person wrote. This is based on Spotlight, which is a personal website template we put together as part of Tailwind Plus a while back. And one of the things you'll notice is that in this list of blog posts, this entire area is clickable. So you can click anywhere here and it'll take you to that post. If we go and take a look at the code, it's implemented probably how you would expect it to be. We've got an anchor tag here and that wraps up all of the content here to make this entire thing clickable. Now naively, you might think that this is the right way to implement this sort of thing, but it has one pretty significant and annoying issue. Imagine you're a screen reader user and you're navigating through this page and you get to one of these links. Your screen reader is going to say something to you like, Link, crafting a design system for a multi-planetary future, September 5th, 2022. Most companies try to stay ahead of the curve when it comes to visual design, but for Planetaria, we needed to create a brand that would still inspire us 100 years from now when humanity is spread across our entire solar system. That's the entire content of the actual link tag. So someone navigating this page, just trying to get through all the links, they're going to have all of that content read to them instead of something more simple like just the title, which is closer to how a sighted user is going to be scanning these links. So let's try and fix this. Let me show you a solution that I really like for this that'll keep the experience great for both sighted users and people using a screen reader. So over here where we have this A tag wrapping up the entire content here, let's replace that with just a simple div. And then the H2, which is the blog post title, let's dig into that thing. And I'm going to make just the blog post title the link instead. So now if I try to use this page, you'll see hovering, I still get the hover effect because the hover stuff is happening on the div, but you'll see the link cursor only appears when I get over the title. So clicking isn't actually going to work unless I click right here. So how can we solve this? Watch this. I'm going to head over to this div. I'm going to make it position relative using the relative class. And then inside of the anchor here, I'm going to add an empty span with a class of absolute and inset zero. And inset zero is kind of a more modern way in CSS to set top zero, right zero, bottom zero, left zero. So what we're doing here is we're creating an element that fills that entire space. And if I give this a background color, you'll see it. So this span, even though it's only part of this little link, is expanding outside of that link and covering up this entire div. And as you might have guessed, this has the nice side effect of turning this all into a clickable area. So now we can click anywhere and still get to the article. There's one spot where it's still a little bit broken though. And that's up here on the date. And that's happening because this time element is positioned relative, which means it's sitting in front of this element because we haven't set any explicit z-indexes to sort of determine the stacking order of the elements. So we can solve that by making sure this span is always in front of everything else. So I'm going to set z10 on this, and then to make sure that this doesn't sort of leak out and interfere with other z-index elements on the page, I'm going to slap isolate on the containing div, which scopes the z-index and makes it sort of local to this group of elements. And now when I hover over the time element, you'll see that we still get that link cursor because now this span is sitting in front of everything else. So if I remove the background color here, you can see we get the exact same experience that we do for these other ones, which I haven't updated, except now when a screen reader user navigates to this link, their screen reader is just going to tell them the blog post title instead of reading them all of that content, which I think is a pretty nice solution. So if you like this, drop your email address into the signup form on the landing page, and I'll send you another video like this every single day for a week, as well as all the code so you can play with it yourself. Hope you check it out, and I'll see you in the other lessons."
segments = [{'start': 0.0, 'end': 4.78, 'text': "Hey, I'm Adam Wathen and I'm the guy who created Tailwind CSS."}, {'start': 4.78, 'end': 8.84, 'text': "Build UIs that don't suck is a little video series I've put together that walks through"}, {'start': 8.84, 'end': 14.16, 'text': "some of the coolest tricks that I've picked up over the years building hundreds of UI"}, {'start': 14.16, 'end': 18.36, 'text': 'components that not only needed to look great, but they also need to work perfectly on different'}, {'start': 18.36, 'end': 24.68, 'text': 'devices, adapt to different content, be accessible to keyboard and screen reader users, and just'}, {'start': 24.68, 'end': 29.14, 'text': 'generally not be subtly broken to anyone with an eye for detail.'}, {'start': 29.14, 'end': 32.72, 'text': "Let me walk you through a quick example of the sort of thing I'm talking about."}, {'start': 32.72, 'end': 37.78, 'text': "So here I've got a little demo of sort of a blog site, right, with a list of articles"}, {'start': 37.78, 'end': 39.34, 'text': 'that this person wrote.'}, {'start': 39.34, 'end': 43.7, 'text': 'This is based on Spotlight, which is a personal website template we put together as part of'}, {'start': 43.7, 'end': 46.1, 'text': 'Tailwind Plus a while back.'}]
print(generate_ai_questions_and_summary(text, segments))