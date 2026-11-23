# Questions asked before starting

Sent to the reviewer on 20 Nov 2026, before any code was written.

1. Who is the main reader, and what do they do after reviewing the changes? For example, is it someone catching up on what changed since their last read, or someone who needs to approve or sign off a new version?
2. Should any two versions be comparable (for example v1 to v3), or mainly the previous version against the latest?
3. If a node keeps its id but moves to another section or changes position, should that count as a change the reader needs to see, or is it mostly noise?
4. Are there changes you would treat as noise, for example whitespace or inline markup formatting in paragraphs, or changes to the document's updatedAt and version fields?

# Answers received

Good questions, thanks for asking them before you start.
1. Reader. The first one: someone catching up. They read an earlier version and need to know what is different now. They are not the author, and they read the document maybe once a quarter, so they do not remember it by heart. After reviewing they do nothing in the app: no approve or sign-off. They read and understand.
2. Versions. The reader can pick any two. Consecutive pairs are the common case. v1 to v3 is a nice-to-have: if it falls out of your design for free, keep it, otherwise consecutive pairs are enough. The older version is the base. Realistically there will be dozens of versions later; you do not need to handle that now, but the design should not make it impossible.
3. Moves and position. Ids are stable identities, so the same id in another section is a move, and the reader should see it. How you present it is your decision. Children that only change order inside the same parent are a minor change: hide them or show them as low priority, but do not show each reordered child as removed and added.
4. Noise.
  - Whitespace: the reader does not care. Hide it or show it as a lower-priority category; your call, document it.
  - Inline markup: if only the formatting changed and the words are the same, treat it like whitespace: your call, document it. Separately, think about how a production app should render this user-provided text, and explain that choice in the README.
  - updatedAt and version: these describe the version, not its content, so they are not "changes" in the diff. They are still useful context for the reader (which versions, from when).
Going with your own assumptions where something is still open is completely fine. Please write them down in the README. Please keep to the 3-hour time box and list what you did not do.
