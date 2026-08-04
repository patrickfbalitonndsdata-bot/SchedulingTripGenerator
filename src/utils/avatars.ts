import React from 'react';

export interface AvatarOption {
  id: string;
  name: string;
  emoji: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
}

export const CUTE_AVATARS: AvatarOption[] = [
  { id: 'panda', name: 'Bamboo Panda', emoji: '🐼', bgGradient: 'from-emerald-500 to-teal-700', borderColor: 'border-emerald-400', textColor: 'text-emerald-100' },
  { id: 'fox', name: 'Clever Fox', emoji: '🦊', bgGradient: 'from-orange-500 to-amber-600', borderColor: 'border-orange-400', textColor: 'text-orange-100' },
  { id: 'bear', name: 'Grizzly Bear', emoji: '🐻', bgGradient: 'from-amber-700 to-yellow-800', borderColor: 'border-amber-500', textColor: 'text-amber-100' },
  { id: 'koala', name: 'Sleepy Koala', emoji: '🐨', bgGradient: 'from-slate-600 to-slate-800', borderColor: 'border-slate-400', textColor: 'text-slate-100' },
  { id: 'lion', name: 'Royal Lion', emoji: '🦁', bgGradient: 'from-amber-400 to-orange-600', borderColor: 'border-amber-300', textColor: 'text-amber-950' },
  { id: 'owl', name: 'Wise Owl', emoji: '🦉', bgGradient: 'from-indigo-600 to-purple-800', borderColor: 'border-indigo-400', textColor: 'text-indigo-100' },
  { id: 'penguin', name: 'Happy Penguin', emoji: '🐧', bgGradient: 'from-cyan-600 to-blue-800', borderColor: 'border-cyan-400', textColor: 'text-cyan-100' },
  { id: 'cat', name: 'Whiskers Cat', emoji: '🐱', bgGradient: 'from-pink-500 to-rose-600', borderColor: 'border-pink-300', textColor: 'text-pink-100' },
  { id: 'dog', name: 'Playful Pup', emoji: '🐶', bgGradient: 'from-yellow-600 to-amber-700', borderColor: 'border-yellow-400', textColor: 'text-yellow-100' },
  { id: 'rabbit', name: 'Fluffy Bunny', emoji: '🐰', bgGradient: 'from-rose-400 to-pink-600', borderColor: 'border-rose-300', textColor: 'text-rose-100' },
  { id: 'tiger', name: 'Little Tiger', emoji: '🐯', bgGradient: 'from-orange-600 to-red-600', borderColor: 'border-orange-400', textColor: 'text-orange-100' },
  { id: 'unicorn', name: 'Magic Unicorn', emoji: '🦄', bgGradient: 'from-purple-500 to-pink-500', borderColor: 'border-purple-300', textColor: 'text-purple-100' },
  { id: 'robot', name: 'Cyber Bot', emoji: '🤖', bgGradient: 'from-sky-500 to-indigo-700', borderColor: 'border-sky-400', textColor: 'text-sky-100' },
  { id: 'astronaut', name: 'Star Explorer', emoji: '🚀', bgGradient: 'from-blue-600 to-violet-800', borderColor: 'border-blue-400', textColor: 'text-blue-100' },
  { id: 'frog', name: 'Hopper Frog', emoji: '🐸', bgGradient: 'from-green-500 to-emerald-700', borderColor: 'border-green-400', textColor: 'text-green-100' },
  { id: 'raccoon', name: 'Bandit Raccoon', emoji: '🦝', bgGradient: 'from-zinc-600 to-slate-800', borderColor: 'border-zinc-400', textColor: 'text-zinc-100' },
];

export function getAvatarById(id?: string): AvatarOption {
  return CUTE_AVATARS.find(a => a.id === id) || CUTE_AVATARS[0];
}
