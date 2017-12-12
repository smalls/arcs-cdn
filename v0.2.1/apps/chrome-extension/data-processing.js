// Copyright (c) 2017 Google Inc. All rights reserved.
// This code may only be used under the BSD style license found at
// http://polymer.github.io/LICENSE.txt
// Code distributed by Google as part of this project is also
// subject to an additional IP rights grant found at
// http://polymer.github.io/PATENTS.txt

/**
 * Reduce the deeply nested structure of url=>entities-of-many-types to a
 * flatter, combined form of type=>entities.
 *
 * For example, the input would be of the form
 * {'http://g.co': [{@type: 'typeA', 'a': 1}},
 * the output would be
 * {typeA: [{@type: 'typeA', 'a': 1}]}.
 */
function flatten(entities) {
  return Object.entries(entities).reduce( (accumulator, [key, value]) => {
    value.forEach(entry => {
      let type = entry['@type'];
      accumulator[type] ? accumulator[type].push(entry) : accumulator[type] = [entry];
    });
    return accumulator;
  }, new Object());
}

/**
 * Removes duplicate entries. Expects the input to match the output format of
 * #flatten().
 */
function deduplicate(entities) {
  return Object.entries(entities).reduce((accumulator, [key, values]) => {
    accumulator[key] = values.reduce((accumulator, value) => {
      let isIncluded = accumulator.reduce((a, av) => _.isEqual(av, value) || a, false);
      isIncluded || accumulator.push(value);
      return accumulator;
    }, []);
    return accumulator;
  }, new Object());
}
