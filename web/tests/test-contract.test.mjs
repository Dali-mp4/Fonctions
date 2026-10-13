import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTestCases, matchesType, testsFromDatabase } from '../src/lib/test-contract.ts';
const code = 'def pgcd(a, b):\n    return a';
const schema = {parameters:[{name:'a',type:'int'},{name:'b',type:'int'}],returns:'int'};
const testCase = (inputs,expected,label='PGCD') => ({id:'1',label,inputsText:inputs,expectedText:expected});
test('valid JSON cases pass preflight but have no Python execution evidence', () => {
  const result=validateTestCases('pgcd',code,schema,[testCase('{"a":24,"b":18}','6')]);
  assert.deepEqual(result.errors,[]);
  assert.equal(result.cases[0].ok,true);
  assert.match(result.cases[0].message,/non exécuté/);
  assert.deepEqual(result.testCases[0], {label:'PGCD',inputs:{a:24,b:18},expected:6});
});
test('rejects malformed cases, missing args and wrong types',()=>{
  for(const tc of [testCase('{oops','6'),testCase('{"a":24}','6'),testCase('{"a":24,"b":"18"}','6'),testCase('{"a":24,"b":18}','"six"')]){
    assert.equal(validateTestCases('pgcd',code,schema,[tc]).cases[0].ok,false);
  }
});
test('rejects unsafe or duplicate function parameters and missing entry point',()=>{
  assert.ok(validateTestCases('pgcd',code,{parameters:[{name:'a',type:'int'},{name:'a',type:'int'}],returns:'int'},[]).errors.length);
  assert.ok(validateTestCases('other',code,schema,[]).errors.length);
});
test('accepts matrix-shaped integer arrays and rejects heterogeneous arrays',()=>{
  assert.equal(matchesType([[1,2],[3,4]],'list[list[int]]'),true);
  assert.equal(matchesType([[1,2],['x',4]],'list[list[int]]'),false);
  assert.equal(matchesType([1,2,3],'list[int]'),true);
});
test('restores saved cases and treats old drafts without cases safely',()=>{
  assert.deepEqual(testsFromDatabase(null),[]);
  const restored=testsFromDatabase([{label:'Exemple',inputs:{a:24,b:18},expected:6}]);
  assert.equal(restored[0].inputsText.includes('"a": 24'),true);
  assert.equal(restored[0].expectedText,'6');
});
