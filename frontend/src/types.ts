/**
 * @license
 * SPDX-License-Identifier: MIT
 */

export interface KeyValue {
  key: string;
  value: string;
}

export interface RedirectData {
  id: string; // Unique ID, can be timestamp
  timestamp: number;
  fullUrl: string;
  queryParams: KeyValue[];
  fragment: string;
}