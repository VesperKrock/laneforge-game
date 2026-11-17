import actor1 from '../assets/visuals/Actor1_1.png?url';
import actor2 from '../assets/visuals/Actor2_1.png?url';
import actor3 from '../assets/visuals/Actor2_4.png?url';
import actor4 from '../assets/visuals/Actor2_7.png?url';
import actor5 from '../assets/visuals/Actor3_6.png?url';
import { APPEARANCES, DEFAULT_APPEARANCE } from './Appearance';
import type { AppearanceId } from './Appearance';

export type VisualPoint = readonly [number, number];
interface HandAnchors { readonly main: VisualPoint; readonly support: VisualPoint }
interface CharacterVisualDefinition {
  readonly appearanceId: AppearanceId; readonly name: string; readonly source: string; readonly texture: string;
  readonly frame: VisualPoint; readonly layout: VisualPoint; readonly origin: VisualPoint;
  readonly scale: number; readonly offset: VisualPoint; readonly nativeFacing: 'left' | 'right';
  readonly idle: readonly number[]; readonly swing: readonly number[]; readonly thrust: readonly number[]; readonly brace: readonly number[];
  readonly anchors: Readonly<Record<number, HandAnchors>>;
  readonly gripRectangle: readonly [number, number, number, number]; readonly gripScale: number;
}
// Reuses the reviewed local audit; points are measured per actor, in its 64x64 frame.
function character(id: AppearanceId, source: string, main: readonly VisualPoint[], support: readonly VisualPoint[], gripY: number, idleOffsets: VisualPoint): CharacterVisualDefinition {
  const anchors: Record<number, HandAnchors> = {};
  const freezePoint = (point: VisualPoint): VisualPoint => Object.freeze([...point]) as VisualPoint;
  for (const [i, frame] of [0, 3, 4, 12, 13].entries()) anchors[frame] = Object.freeze({ main: freezePoint(main[i]), support: freezePoint(support[i]) });
  for (const [i, dy] of idleOffsets.entries()) anchors[i + 1] = Object.freeze({
    main: freezePoint([main[0][0], main[0][1] + dy]), support: freezePoint([support[0][0], support[0][1] + dy]),
  });
  anchors[5] = anchors[4]; anchors[14] = anchors[13]; // Audited pixel-identical hold frames.
  return Object.freeze({ appearanceId: id, name: APPEARANCES.find(a => a.id === id)!.name, source,
    texture: id === DEFAULT_APPEARANCE ? 'lf-actor' : `lf-${id}`,
    frame: freezePoint([64, 64]), layout: freezePoint([9, 6]), origin: freezePoint([32, 64]),
    scale: 1, offset: freezePoint([0, 0]), nativeFacing: 'left',
    idle: Object.freeze([0, 1, 2, 1]), swing: Object.freeze([12, 13, 14]), thrust: Object.freeze([3, 4, 5]), brace: Object.freeze([12, 12, 12]),
    anchors: Object.freeze(anchors), gripRectangle: Object.freeze([259, gripY, 10, 11] as const), gripScale: .72,
  });
}
export const CHARACTER_VISUALS: Readonly<Record<AppearanceId, CharacterVisualDefinition>> = Object.freeze({
  actor_1_1: character('actor_1_1', actor1, [[21,46],[19,43],[8,43],[21,46],[13,50]], [[35,50],[31,43],[38,47],[35,50],[38,47]], 38, [2,3]),
  actor_2_1: character('actor_2_1', actor2, [[21,45],[19,41],[8,41],[21,43],[13,48]], [[35,48],[31,42],[38,45],[34,45],[38,45]], 36, [1,2]),
  actor_2_4: character('actor_2_4', actor3, [[20,45],[19,40],[7,40],[20,42],[13,49]], [[34,47],[31,41],[37,44],[33,44],[37,44]], 35, [1,2]),
  actor_2_7: character('actor_2_7', actor4, [[20,44],[20,41],[8,41],[20,43],[13,48]], [[36,47],[30,44],[37,45],[32,46],[37,45]], 36, [1,2]),
  actor_3_6: character('actor_3_6', actor5, [[20,45],[19,41],[8,41],[20,43],[13,49]], [[36,45],[29,43],[38,44],[31,46],[38,44]], 36, [1,2]),
});
