import { Command } from '@tiptap/core';

export const insertSpeakerLine = (speaker: string): Command => ({ commands }) => {
  return commands.insertContent({
    type: 'speakerLine',
    attrs: { speaker },
  });
};

export const insertStageDirection = (text: string): Command => ({ commands }) => {
  return commands.insertContent({
    type: 'stageDirection',
    attrs: { text },
  });
};

export const toggleDelivery = (): Command => ({ tr, state, dispatch }) => {
  const { selection } = state;
  const { $from, $to } = selection;

  let toggled = false;
  
  state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
    if (node.type.name === 'lyricLine') {
      if (dispatch) {
        const currentDelivery = node.attrs.delivery;
        const newDelivery = currentDelivery === 'sung' ? 'spoken' : 'sung';
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, delivery: newDelivery });
      }
      toggled = true;
    }
  });

  return toggled;
};
