import { describe, test, expect } from '@jest/globals';
import { IntegrationReference } from '../integration';

import * as parse from './parse';

function expectBasicSamples(refs: Record<string, IntegrationReference>) {
  expect(Object.keys(refs)).toHaveLength(2);

  const lookingClosely = refs['https://craigmod.com/essays/looking_closely/'];
  expect(lookingClosely.title.includes('Closely'));
  expect(lookingClosely.url.includes('craigmod.com/essays/looking_closely'));
  expect(lookingClosely.highlights).toHaveLength(2);
  expect(
    lookingClosely.highlights[0].quote.includes('You gotta go _huh, alright_')
  );
  expect(
    lookingClosely.highlights[1].quote.includes(
      'We tend to see in groups, not details'
    )
  );
  expect(lookingClosely.highlights[1].comment.includes('Nice quote!'));

  const historyEmpathy =
    refs[
      'https://www.reddit.com/r/AskHistorians/comments/6qn4k3/monday_methods_we_talk_about_actual_human_beings/'
    ];
  expect(
    historyEmpathy.title.includes(
      'on Empathy as the central skill of historians'
    )
  );
  expect(historyEmpathy.highlights).toHaveLength(1);
}

describe('parseArticles', () => {
  test('IFTT format: block quote series', () => {
    const refs = parse.parseArticles(`
> I’d say that that _huh_ is the foundational block of curiosity. To get good at the _huh_ is to get good at both paying attention and nurturing compassion; if you don’t notice, you can’t give a shit. But the _huh_ is only half the equation. You gotta go _huh, alright_ — the "alright," the follow-up, the openness to what comes next is where the cascade lives. It’s the sometimes-sardonic, sometimes-optimistic engine driving the next _huh_ and so on and so forth. 

[Looking Closely is Everything](https://craigmod.com/essays/looking_closely/)

> We tend to see in groups, not details. We scan an image or scene for the gist, but miss a richness of particulars. I suspect this has only gotten worse in recent years as our Daily Processed Information density has increased, causing us to engage less rigorously — we listen to podcasts on 2x speed or watch YouTube videos with a finger on the arrow-keys to fast-foward through any moment of lesser tension. Which means we need all the help we can get to prod ourselves to look more closely, and a good description can help do just that.

Nice quote!

[Looking Closely is Everything](https://craigmod.com/essays/looking_closely/)

> At the very center of the historical endeavor lies an undeniable and universal truth: When we talk about the past, we talk about actual people. Actual, real-life, flesh and blood Human beings who during the time they were alive lead actual lives, who felt happiness and sadness, joy and pain, love and hate, hunger and cold and who experienced triumph, tragedy, victory, defeat, and sacrifice.

[Monday Methods: We talk about actual human beings and "get your feels out of history" is wrong – on Empathy as the central skill of historians](https://www.reddit.com/r/AskHistorians/comments/6qn4k3/monday_methods_we_talk_about_actual_human_beings/)
`);
    expectBasicSamples(refs);
  });

  test('Roam Highlighter: list quotes', () => {
    const refs = parse.parseArticles(`
- [Looking Closely is Everything](https://craigmod.com/essays/looking_closely/)
  - I’d say that that _huh_ is the foundational block of curiosity. To get good at the _huh_ is to get good at both paying attention and nurturing compassion; if you don’t notice, you can’t give a shit. But the _huh_ is only half the equation. You gotta go _huh, alright_ — the "alright," the follow-up, the openness to what comes next is where the cascade lives. It’s the sometimes-sardonic, sometimes-optimistic engine driving the next _huh_ and so on and so forth. 
  - We tend to see in groups, not details. We scan an image or scene for the gist, but miss a richness of particulars. I suspect this has only gotten worse in recent years as our Daily Processed Information density has increased, causing us to engage less rigorously — we listen to podcasts on 2x speed or watch YouTube videos with a finger on the arrow-keys to fast-foward through any moment of lesser tension. Which means we need all the help we can get to prod ourselves to look more closely, and a good description can help do just that.
    - Nice quote!
- [Monday Methods: We talk about actual human beings and "get your feels out of history" is wrong – on Empathy as the central skill of historians](https://www.reddit.com/r/AskHistorians/comments/6qn4k3/monday_methods_we_talk_about_actual_human_beings/)
  - At the very center of the historical endeavor lies an undeniable and universal truth: When we talk about the past, we talk about actual people. Actual, real-life, flesh and blood Human beings who during the time they were alive lead actual lives, who felt happiness and sadness, joy and pain, love and hate, hunger and cold and who experienced triumph, tragedy, victory, defeat, and sacrifice.
`);
    console.log(JSON.stringify(refs, null, ' '));
    expectBasicSamples(refs);
  });

  test('Roam Highlighter: list quotes, last item is a comment', () => {
    const refs = parse.parseArticles(`
- [Looking Closely is Everything](https://craigmod.com/essays/looking_closely/)
  - I’d say that that _huh_ is the foundational block of curiosity. To get good at the _huh_ is to get good at both paying attention and nurturing compassion; if you don’t notice, you can’t give a shit. But the _huh_ is only half the equation. You gotta go _huh, alright_ — the "alright," the follow-up, the openness to what comes next is where the cascade lives. It’s the sometimes-sardonic, sometimes-optimistic engine driving the next _huh_ and so on and so forth. 
  - We tend to see in groups, not details. We scan an image or scene for the gist, but miss a richness of particulars. I suspect this has only gotten worse in recent years as our Daily Processed Information density has increased, causing us to engage less rigorously — we listen to podcasts on 2x speed or watch YouTube videos with a finger on the arrow-keys to fast-foward through any moment of lesser tension. Which means we need all the help we can get to prod ourselves to look more closely, and a good description can help do just that.
    - Nice quote!
`);
    console.log(JSON.stringify(refs, null, ' '));
    const lookingClosely = refs['https://craigmod.com/essays/looking_closely/'];
    expect(lookingClosely.title.includes('Closely'));
    expect(lookingClosely.highlights).toHaveLength(2);
    expect(lookingClosely.highlights[1].comment.includes('Nice quote!'));
  });
});
