import {expect,it} from 'vitest';
import {reorderPhotos,type PlannerItem} from '../src/features/planner/InstagramPlanner';
it('moves a photo to the requested position without losing duplicate names or file references',()=>{const file=new File(['test'],'same.jpg',{type:'image/jpeg'});const items:PlannerItem[]=['a','b','c'].map(id=>({id,name:'same.jpg',file}));const moved=reorderPhotos(items,'a','c');expect(moved.map(i=>i.id)).toEqual(['b','c','a']);expect(moved[2]).toBe(items[0]);expect(items.map(i=>i.id)).toEqual(['a','b','c']);expect(reorderPhotos(items,'missing','a')).toBe(items);});
