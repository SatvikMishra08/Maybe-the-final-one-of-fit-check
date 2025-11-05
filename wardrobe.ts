/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { WardrobeItem } from './types';

// Default wardrobe items are now structured with variants.
export const defaultWardrobe: WardrobeItem[] = [
  {
    id: 'gemini-sweat',
    name: 'Gemini Sweat',
    materialBlend: [{ material: 'Cotton', percentage: 100 }],
    gsm: 320,
    fit: 'Regular',
    designApplication: 'Embroidery',
    variants: [
      {
        id: 'gemini-sweat-gray',
        colorName: 'Heather Gray',
        views: {
          front: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAABNElEQVR4nO3BAQEAAACAkP6v7ggKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG43+wABWjE52gAAAABJRU5ErkJggg==',
        },
      }
    ],
    measurements: [
      { id: 's', sizeLabel: 'S', measurements: [{dimension: 'chest', value: 20}, {dimension: 'length', value: 27}, {dimension: 'sleeve', value: 35}, {dimension: 'shoulder_width', value: 18}, {dimension: 'waist', value: 19}, {dimension: 'sleeve_opening', value: 4}], unit: 'in' },
      { id: 'm', sizeLabel: 'M', measurements: [{dimension: 'chest', value: 22}, {dimension: 'length', value: 28}, {dimension: 'sleeve', value: 36}, {dimension: 'shoulder_width', value: 20}, {dimension: 'waist', value: 21}, {dimension: 'sleeve_opening', value: 4.5}], unit: 'in' },
      { id: 'l', sizeLabel: 'L', measurements: [{dimension: 'chest', value: 24}, {dimension: 'length', value: 29}, {dimension: 'sleeve', value: 37}, {dimension: 'shoulder_width', value: 22}, {dimension: 'waist', value: 23}, {dimension: 'sleeve_opening', value: 5}], unit: 'in' },
    ]
  },
  {
    id: 'gemini-tee',
    name: 'Gemini Tee',
    materialBlend: [{ material: 'Cotton', percentage: 100 }],
    gsm: 180,
    fit: 'Regular',
    designApplication: 'DTG',
    variants: [
      {
        id: 'gemini-tee-white',
        colorName: 'Optic White',
        views: {
          front: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAa0lEQVR4nO3BMQEAAADCoPVPbQ0PoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4GuN4AAG1d2hCAAAAAElFTSuQmCC',
        },
      },
      {
        id: 'gemini-tee-black',
        colorName: 'Midnight Black',
        views: {
          front: 'https://storage.googleapis.com/gemini-95-icons/gemini-tee-black.png',
        },
      }
    ],
    measurements: [
      { id: 's', sizeLabel: 'S', measurements: [{dimension: 'chest', value: 18}, {dimension: 'length', value: 28}, {dimension: 'sleeve', value: 8.5}, {dimension: 'shoulder_width', value: 17}, {dimension: 'waist', value: 17.5}, {dimension: 'sleeve_opening', value: 6}], unit: 'in' },
      { id: 'm', sizeLabel: 'M', measurements: [{dimension: 'chest', value: 20}, {dimension: 'length', value: 29}, {dimension: 'sleeve', value: 9}, {dimension: 'shoulder_width', value: 19}, {dimension: 'waist', value: 19.5}, {dimension: 'sleeve_opening', value: 6.5}], unit: 'in' },
      { id: 'l', sizeLabel: 'L', measurements: [{dimension: 'chest', value: 22}, {dimension: 'length', value: 30}, {dimension: 'sleeve', value: 9.5}, {dimension: 'shoulder_width', value: 21}, {dimension: 'waist', value: 21.5}, {dimension: 'sleeve_opening', value: 7}], unit: 'in' },
    ]
  },
  {
    id: 'gemini-cap',
    name: 'Gemini Cap',
    materialBlend: [{ material: 'Cotton', percentage: 100 }],
    fit: 'Regular',
    designApplication: 'Embroidery',
    variants: [
      {
        id: 'gemini-cap-black',
        colorName: 'Black',
        views: {
          front: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAa0lEQVR4nO3BMQEAAADCoPVPbQ0PoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4GuN4AAG1d2hCAAAAAElFTSuQmCC',
        },
      }
    ],
  },
  {
    id: 'nano-banana-shorts',
    name: 'Nano Shorts',
    materialBlend: [{ material: 'Cotton', percentage: 100 }],
    gsm: 280,
    fit: 'Regular',
    variants: [
      {
        id: 'nano-shorts-blue',
        colorName: 'Blue',
        views: {
          front: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAa0lEQVR4nO3BMQEAAADCoPVPbQ0PoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4GuN4AAG1d2hCAAAAAElFTSuQmCC',
        },
      }
    ]
  },
  {
    id: 'cloud-socks',
    name: 'Cloud Socks',
    materialBlend: [{ material: 'Cotton', percentage: 100 }],
    fit: 'Regular',
    designApplication: 'Embroidery',
    variants: [
      {
        id: 'cloud-socks-white',
        colorName: 'White',
        views: {
          front: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAABNElEQVR4nO3BAQEAAACAkP6v7ggKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG43+wABWjE52gAAAABJRU5ErkJggg==',
        },
      }
    ]
  },
  {
    id: 'blue-jacket',
    name: 'Blue Jacket',
    materialBlend: [{ material: 'Denim', percentage: 100 }],
    gsm: 400,
    fit: 'Oversized',
    variants: [
      {
        id: 'blue-jacket-denim',
        colorName: 'Denim',
        views: {
          front: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAa0lEQVR4nO3BMQEAAADCoPVPbQ0PoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4GuN4AAG1d2hCAAAAAElFTSuQmCC',
        },
      }
    ]
  },
];