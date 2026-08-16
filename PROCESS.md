# Process overview

## What I built

The Blackjack Probability Explainer is a one-page interactive website. Blackjack is the game. The subject is decision-making under uncertainty.
The website has three acts. The acts follow one hand for one visitor.

1. Act One shows a static introduction of blackjack and the probability calculation.
2. Act Two shows we let the visitor play the hand, and showing the draw probabilities.
3. Act Three shows the conclusion: even a maximised calculation state (a tracked count) does not guarantee a good outcome on one hand.

The website uses a seeded Monte Carlo method to calculate play-out distributions. The counter on the screen shows this simulation as it runs. The counter does not show a fake count.
The last line on the page states the main point: a good decision does not guarantee a good outcome.

## The moments that mattered

1. **Brainstorming.** This step decided the direction of the project for a long time. I had two main ideas. I chose the blackjack idea because it does not need heavy assets. (I keep a log of another session of brainstorming in [meta/chatgpt-discuss/dialogue.md](meta/chatgpt-discuss/dialogue.md).) At this stage, I moved the `claude.md` and `process.md` templates out of the way. This step stops them from changing the initial prompt. Then I ran the `/grill-me` skill to shape the idea and the `claude.md` file. This step also makes sure the planning stage does not miss anything. The `/grill-me` skill asks me questions. These questions help the agent understand my idea. The skill then writes the `claude.md` and `context.md` files based on my answers.
   ([`0d7329b...87f98ee`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-edwarbudiman/compare/0d7329b...87f98ee))

2. **Specification and tickets.** After a long `/grill-me` session, I ran the `/to-spec` and `/to-ticket` skills. These skills use the `/grill-me` output to create structured tickets. The output goes into a `.scratch` folder. This folder contains:
   - **issues**: the main tickets. Each ticket describes a task needed to finish the project.
   - **design.md**: the design of the project. This file describes the style and the flow of the project.
   - **spec.md**: the specification of the project. This file is the test harness for the project. It also contains the user stories.

   After this, I asked the LLM to create a wireframe. I checked the design, the spec, and the flow. I adjusted them when they did not match my expectations. This stage produced `frames.html` and `styleframe.html`. I used these two files to guide the rest of the development. This stage also generated an issues folder for every ticket. I used these tickets to develop the project.
   ([`516d69d...432708a`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-edwarbudiman/compare/516d69d...432708a))

3. **Automatic development.** At this stage, the agents ran on their own for the rest of the development. The tickets were ready. The design spec was ready. The spec was ready. I let the agents run and implement everything with sub-agents. I chose the `/grill-me` approach for this reason: when all the pieces are ready, the agent can orchestrate and handle the development on its own. I only had to wait until all tests passed.
   ([`9b01e1a...baaa9f1`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-edwarbudiman/compare/9b01e1a...baaa9f1))

During stage two, the agents were still deciding the design. At this point, I gave input and checked the work by hand, in cycles, until I was satisfied with the design and spec. Each time the agents finished a wireframe, I checked the design. If it did not match my expectations, I gave feedback. I then decided whether to run `/grill-me` again, and surprisingly, it works just like that, it still remember the previous context of `/grill-me` and just continue updating information based on feedback.