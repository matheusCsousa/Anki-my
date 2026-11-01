import { test } from "node:test";
import assert from "node:assert/strict";
import { applyReview, formatDelay, mergeStudyCards } from "../src/utils/study.ts";
const card = (id, due=true) => ({id,front:id,back:"answer",due,due_at:null,interval_days:0,review_delays:{again:60,hard:86400,good:259200,easy:604800}});
test("every grade removes a saved card until the server marks it due again", () => {
 for(const [grade,seconds] of Object.entries(card("a").review_delays)) {
  const initial=[card("a"),card("b")];
  const updated=applyReview(initial,"a",{due_at:100000+seconds*1000,interval_days:0,delay_seconds:seconds});
  assert.deepEqual(updated.filter(c=>c.due).map(c=>c.id),["b"],grade);
  assert.equal(updated[0].due_at,100000+seconds*1000);
  assert.equal(initial[0].due,true,"Do not mutate prior state");
 }
});
test("background refresh adds returning cards behind the visible card", () => {
 const previous=[card("again",false),card("current")];
 const result=mergeStudyCards(previous,[card("again"),card("current")]);
 assert.deepEqual(result.map(c=>c.id),["current","again"]);
 assert.equal(mergeStudyCards(result,[card("again",false),card("current",false)]).filter(c=>c.due).length,0);
});
test("button labels show real intervals", () => {
 assert.equal(formatDelay(60),"1 min");assert.equal(formatDelay(86400),"1 day");assert.equal(formatDelay(259200),"3 days");assert.equal(formatDelay(604800),"7 days");
});
