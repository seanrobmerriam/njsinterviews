// prisma/seed.ts
import { PrismaClient, Difficulty, Category, Language } from "@prisma/client";

const prisma = new PrismaClient();

// ── Problem definitions ────────────────────────────────────────────────

const problems = [
  // ── EASY — Arrays & Hashing ──────────────────────────────────────────
  {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: Difficulty.EASY,
    category: Category.ARRAYS_HASHING,
    isFree: true,
    isPremium: false,
    tags: ["array", "hash-table"],
    orderIndex: 1,
    description: `## Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
      { input: "nums = [3,3], target = 6", output: "[0,1]" },
    ],
    constraints: { "2 <= nums.length <= 10^4": true, "-10^9 <= nums[i] <= 10^9": true, "Only one valid answer exists.": true },
    hints: [
      "Think about what complement each number needs. Can you check existence in O(1)?",
      "A hash map can let you look up whether the complement of each number already exists.",
      "Iterate once: for each nums[i], check if (target - nums[i]) is in your map. If yes, return [map[complement], i]. If no, store nums[i] -> i.",
    ],
    starterCode: [
      {
        language: Language.JAVASCRIPT,
        code: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Your solution here
};`,
      },
      {
        language: Language.PYTHON,
        code: `from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Your solution here
        pass`,
      },
      {
        language: Language.GO,
        code: `func twoSum(nums []int, target int) []int {
    // Your solution here
    return nil
}`,
      },
      {
        language: Language.TYPESCRIPT,
        code: `function twoSum(nums: number[], target: number): number[] {
  // Your solution here
  return [];
}`,
      },
    ],
    testCases: [
      { input: "2 7 11 15\n9", output: "0 1", isHidden: false },
      { input: "3 2 4\n6", output: "1 2", isHidden: false },
      { input: "3 3\n6", output: "0 1", isHidden: true },
      { input: "1 5 3 2\n4", output: "2 3", isHidden: true },
    ],
    officialSolution: {
      language: Language.JAVASCRIPT,
      code: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [];
}`,
      explanation: "## Hash Map Solution\n\nUse a hash map to store each number and its index as we iterate. For each element, compute `complement = target - nums[i]`. If the complement already exists in the map, we found our answer.\n\nThis gives us a single-pass O(n) solution.",
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
    },
  },

  // ── EASY — Arrays & Hashing ──────────────────────────────────────────
  {
    slug: "contains-duplicate",
    title: "Contains Duplicate",
    difficulty: Difficulty.EASY,
    category: Category.ARRAYS_HASHING,
    isFree: true,
    isPremium: false,
    tags: ["array", "hash-table", "sorting"],
    orderIndex: 2,
    description: `## Contains Duplicate

Given an integer array \`nums\`, return \`true\` if any value appears **at least twice** in the array, and return \`false\` if every element is distinct.`,
    examples: [
      { input: "nums = [1,2,3,1]", output: "true" },
      { input: "nums = [1,2,3,4]", output: "false" },
      { input: "nums = [1,1,1,3,3,4,3,2,4,2]", output: "true" },
    ],
    constraints: { "1 <= nums.length <= 10^5": true, "-10^9 <= nums[i] <= 10^9": true },
    hints: [
      "What data structure lets you check membership in O(1)?",
      "A Set tracks unique elements. Insert each number; if it already exists, you have a duplicate.",
    ],
    starterCode: [
      {
        language: Language.JAVASCRIPT,
        code: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
function containsDuplicate(nums) {
  // Your solution here
};`,
      },
      {
        language: Language.PYTHON,
        code: `from typing import List

class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        # Your solution here
        pass`,
      },
      {
        language: Language.GO,
        code: `func containsDuplicate(nums []int) bool {
    // Your solution here
    return false
}`,
      },
      {
        language: Language.TYPESCRIPT,
        code: `function containsDuplicate(nums: number[]): boolean {
  // Your solution here
  return false;
}`,
      },
    ],
    testCases: [
      { input: "1 2 3 1", output: "true", isHidden: false },
      { input: "1 2 3 4", output: "false", isHidden: false },
      { input: "1 1 1 3 3 4 3 2 4 2", output: "true", isHidden: true },
      { input: "99", output: "false", isHidden: true },
    ],
    officialSolution: {
      language: Language.JAVASCRIPT,
      code: `function containsDuplicate(nums) {
  const seen = new Set();
  for (const n of nums) {
    if (seen.has(n)) return true;
    seen.add(n);
  }
  return false;
}`,
      explanation: "## Set Approach\n\nInsert each element into a Set. If the element is already present, return `true`. If we finish the loop without finding a duplicate, return `false`.",
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
    },
  },

  // ── MEDIUM — Arrays & Hashing ─────────────────────────────────────────
  {
    slug: "group-anagrams",
    title: "Group Anagrams",
    difficulty: Difficulty.MEDIUM,
    category: Category.ARRAYS_HASHING,
    isFree: true,
    isPremium: false,
    tags: ["array", "hash-table", "string", "sorting"],
    orderIndex: 3,
    description: `## Group Anagrams

Given an array of strings \`strs\`, group **the anagrams** together. You can return the answer in **any order**.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    examples: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' },
      { input: 'strs = [""]', output: '[[""]]' },
      { input: 'strs = ["a"]', output: '[["a"]]' },
    ],
    constraints: { "1 <= strs.length <= 10^4": true, "0 <= strs[i].length <= 100": true, "strs[i] consists of lowercase English letters": true },
    hints: [
      "Two strings are anagrams if they contain the same characters. How can you create a canonical representation?",
      "Sorting the characters of each string produces the same result for all anagrams.",
      "Use a hash map where the key is the sorted string and the value is the list of original strings with that key.",
    ],
    starterCode: [
      {
        language: Language.JAVASCRIPT,
        code: `/**
 * @param {string[]} strs
 * @return {string[][]}
 */
function groupAnagrams(strs) {
  // Your solution here
};`,
      },
      {
        language: Language.PYTHON,
        code: `from typing import List

class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        # Your solution here
        pass`,
      },
      {
        language: Language.GO,
        code: `func groupAnagrams(strs []string) [][]string {
    // Your solution here
    return nil
}`,
      },
      {
        language: Language.TYPESCRIPT,
        code: `function groupAnagrams(strs: string[]): string[][] {
  // Your solution here
  return [];
}`,
      },
    ],
    testCases: [
      { input: "eat tea tan ate nat bat", output: "bat\nnat tan\nate eat tea", isHidden: false },
      { input: "", output: "", isHidden: false },
      { input: "a", output: "a", isHidden: true },
      { input: "abc cba bca xyz zyx", output: "abc bca cba\nxyz zyx", isHidden: true },
    ],
    officialSolution: {
      language: Language.JAVASCRIPT,
      code: `function groupAnagrams(strs) {
  const map = new Map();
  for (const s of strs) {
    const key = s.split('').sort().join('');
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(s);
  }
  return Array.from(map.values());
}`,
      explanation: "## Sorted Key\n\nFor each string, sort its characters to create a canonical key. All anagrams will have the same sorted key. Use a hash map from key → array of original strings.",
      timeComplexity: "O(n * k log k) where k is max string length",
      spaceComplexity: "O(n * k)",
    },
  },

  // ── EASY — Two Pointers ───────────────────────────────────────────────
  {
    slug: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: Difficulty.EASY,
    category: Category.TWO_POINTERS,
    isFree: true,
    isPremium: false,
    tags: ["string", "two-pointers"],
    orderIndex: 4,
    description: `## Valid Palindrome

A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string \`s\`, return \`true\` if it is a **palindrome**, or \`false\` otherwise.`,
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: "true", explanation: '"amanaplanacanalpanama" is a palindrome.' },
      { input: 's = "race a car"', output: "false", explanation: '"raceacar" is not a palindrome.' },
      { input: 's = " "', output: "true", explanation: "After removing non-alphanumeric characters, s is an empty string. An empty string reads the same forward and backward." },
    ],
    constraints: { "1 <= s.length <= 2 * 10^5": true, "s consists only of printable ASCII characters": true },
    hints: [
      "Strip non-alphanumeric characters and lowercase before comparing.",
      "Use two pointers: one at the start, one at the end. Move inward, comparing characters.",
    ],
    starterCode: [
      {
        language: Language.JAVASCRIPT,
        code: `/**
 * @param {string} s
 * @return {boolean}
 */
function isPalindrome(s) {
  // Your solution here
};`,
      },
      {
        language: Language.PYTHON,
        code: `class Solution:
    def isPalindrome(self, s: str) -> bool:
        # Your solution here
        pass`,
      },
      {
        language: Language.GO,
        code: `func isPalindrome(s string) bool {
    // Your solution here
    return false
}`,
      },
      {
        language: Language.TYPESCRIPT,
        code: `function isPalindrome(s: string): boolean {
  // Your solution here
  return false;
}`,
      },
    ],
    testCases: [
      { input: "A man, a plan, a canal: Panama", output: "true", isHidden: false },
      { input: "race a car", output: "false", isHidden: false },
      { input: " ", output: "true", isHidden: true },
      { input: "0P", output: "false", isHidden: true },
    ],
    officialSolution: {
      language: Language.JAVASCRIPT,
      code: `function isPalindrome(s) {
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let l = 0, r = clean.length - 1;
  while (l < r) {
    if (clean[l] !== clean[r]) return false;
    l++; r--;
  }
  return true;
}`,
      explanation: "## Two Pointers\n\nFirst clean the string (lowercase + remove non-alphanumeric). Then use two pointers from both ends converging inward. If any pair mismatches, return false.",
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
    },
  },

  // ── MEDIUM — Sliding Window ───────────────────────────────────────────
  {
    slug: "longest-substring-without-repeating",
    title: "Longest Substring Without Repeating Characters",
    difficulty: Difficulty.MEDIUM,
    category: Category.SLIDING_WINDOW,
    isFree: true,
    isPremium: false,
    tags: ["hash-table", "string", "sliding-window"],
    orderIndex: 5,
    description: `## Longest Substring Without Repeating Characters

Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: "1", explanation: 'The answer is "b", with the length of 1.' },
      { input: 's = "pwwkew"', output: "3", explanation: 'The answer is "wke", with the length of 3.' },
    ],
    constraints: { "0 <= s.length <= 5 * 10^4": true, "s consists of English letters, digits, symbols and spaces": true },
    hints: [
      "Think about maintaining a window of characters that contains no duplicates.",
      "Use two pointers (left and right) to define a sliding window. A set or map tracks characters in the current window.",
      "When a duplicate is found at `right`, advance `left` past the previous occurrence of that character.",
    ],
    starterCode: [
      {
        language: Language.JAVASCRIPT,
        code: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
  // Your solution here
};`,
      },
      {
        language: Language.PYTHON,
        code: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # Your solution here
        pass`,
      },
      {
        language: Language.GO,
        code: `func lengthOfLongestSubstring(s string) int {
    // Your solution here
    return 0
}`,
      },
      {
        language: Language.TYPESCRIPT,
        code: `function lengthOfLongestSubstring(s: string): number {
  // Your solution here
  return 0;
}`,
      },
    ],
    testCases: [
      { input: "abcabcbb", output: "3", isHidden: false },
      { input: "bbbbb", output: "1", isHidden: false },
      { input: "pwwkew", output: "3", isHidden: true },
      { input: "", output: "0", isHidden: true },
      { input: "aab", output: "2", isHidden: true },
    ],
    officialSolution: {
      language: Language.JAVASCRIPT,
      code: `function lengthOfLongestSubstring(s) {
  const map = new Map();
  let max = 0, left = 0;
  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right]) && map.get(s[right]) >= left) {
      left = map.get(s[right]) + 1;
    }
    map.set(s[right], right);
    max = Math.max(max, right - left + 1);
  }
  return max;
}`,
      explanation: "## Sliding Window + Hash Map\n\nMaintain a window `[left, right]`. A map stores the last seen index of each character. When we encounter a duplicate within the window, move `left` to `lastIndex + 1`. Track the maximum window size.",
      timeComplexity: "O(n)",
      spaceComplexity: "O(min(n, m)) where m is the charset size",
    },
  },

  // ── EASY — Stack ──────────────────────────────────────────────────────
  {
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: Difficulty.EASY,
    category: Category.STACK,
    isFree: true,
    isPremium: false,
    tags: ["string", "stack"],
    orderIndex: 6,
    description: `## Valid Parentheses

Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    constraints: { "1 <= s.length <= 10^4": true, "s consists of parentheses only '()[]{}'": true },
    hints: [
      "Think about what data structure preserves ordering and lets you match the most recent open bracket.",
      "A stack is ideal: push opening brackets, pop when you see a closing bracket and verify they match.",
    ],
    starterCode: [
      {
        language: Language.JAVASCRIPT,
        code: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // Your solution here
};`,
      },
      {
        language: Language.PYTHON,
        code: `class Solution:
    def isValid(self, s: str) -> bool:
        # Your solution here
        pass`,
      },
      {
        language: Language.GO,
        code: `func isValid(s string) bool {
    // Your solution here
    return false
}`,
      },
      {
        language: Language.TYPESCRIPT,
        code: `function isValid(s: string): boolean {
  // Your solution here
  return false;
}`,
      },
    ],
    testCases: [
      { input: "()", output: "true", isHidden: false },
      { input: "()[]{}", output: "true", isHidden: false },
      { input: "(]", output: "false", isHidden: true },
      { input: "([)]", output: "false", isHidden: true },
      { input: "{[]}", output: "true", isHidden: true },
    ],
    officialSolution: {
      language: Language.JAVASCRIPT,
      code: `function isValid(s) {
  const stack = [];
  const pairs = { ')': '(', '}': '{', ']': '[' };
  for (const c of s) {
    if ('([{'.includes(c)) { stack.push(c); }
    else if (stack.pop() !== pairs[c]) return false;
  }
  return stack.length === 0;
}`,
      explanation: "## Stack\n\nPush every opening bracket onto a stack. For each closing bracket, pop the stack and check if it matches the expected opening bracket. At the end the stack must be empty.",
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
    },
  },

  // ── MEDIUM — Binary Search ────────────────────────────────────────────
  {
    slug: "binary-search",
    title: "Binary Search",
    difficulty: Difficulty.EASY,
    category: Category.BINARY_SEARCH,
    isFree: true,
    isPremium: false,
    tags: ["array", "binary-search"],
    orderIndex: 7,
    description: `## Binary Search

Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.`,
    examples: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4", explanation: "9 exists in nums and its index is 4." },
      { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1", explanation: "2 does not exist in nums so return -1." },
    ],
    constraints: { "1 <= nums.length <= 10^4": true, "-10^4 < nums[i], target < 10^4": true, "All the integers in nums are unique": true, "nums is sorted in ascending order": true },
    hints: [
      "The array is sorted — you can eliminate half the search space each step.",
      "Maintain low and high pointers. Compare the middle element with target.",
    ],
    starterCode: [
      {
        language: Language.JAVASCRIPT,
        code: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function search(nums, target) {
  // Your solution here
};`,
      },
      {
        language: Language.PYTHON,
        code: `from typing import List

class Solution:
    def search(self, nums: List[int], target: int) -> int:
        # Your solution here
        pass`,
      },
      {
        language: Language.GO,
        code: `func search(nums []int, target int) int {
    // Your solution here
    return -1
}`,
      },
      {
        language: Language.TYPESCRIPT,
        code: `function search(nums: number[], target: number): number {
  // Your solution here
  return -1;
}`,
      },
    ],
    testCases: [
      { input: "-1 0 3 5 9 12\n9", output: "4", isHidden: false },
      { input: "-1 0 3 5 9 12\n2", output: "-1", isHidden: false },
      { input: "5\n5", output: "0", isHidden: true },
      { input: "1 3 5\n1", output: "0", isHidden: true },
    ],
    officialSolution: {
      language: Language.JAVASCRIPT,
      code: `function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
      explanation: "## Classic Binary Search\n\nMaintain `lo` and `hi` pointers. At each step compute `mid`. If `nums[mid]` equals target return `mid`. If it's less than target, search right half; otherwise search left half.",
      timeComplexity: "O(log n)",
      spaceComplexity: "O(1)",
    },
  },

  // ── MEDIUM — Linked List ──────────────────────────────────────────────
  {
    slug: "reverse-linked-list",
    title: "Reverse Linked List",
    difficulty: Difficulty.EASY,
    category: Category.LINKED_LIST,
    isFree: true,
    isPremium: false,
    tags: ["linked-list", "recursion"],
    orderIndex: 8,
    description: `## Reverse Linked List

Given the \`head\` of a singly linked list, reverse the list, and return *the reversed list*.`,
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
      { input: "head = [1,2]", output: "[2,1]" },
      { input: "head = []", output: "[]" },
    ],
    constraints: { "The number of nodes in the list is in range [0, 5000]": true, "-5000 <= Node.val <= 5000": true },
    hints: [
      "Think about what you need to track as you walk the list forward.",
      "You need to remember the previous node to reverse the pointer. Track: prev, curr, next.",
    ],
    starterCode: [
      {
        language: Language.JAVASCRIPT,
        code: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *   this.val = (val===undefined ? 0 : val);
 *   this.next = (next===undefined ? null : next);
 * }
 */
/**
 * @param {ListNode} head
 * @return {ListNode}
 */
function reverseList(head) {
  // Your solution here
};`,
      },
      {
        language: Language.PYTHON,
        code: `from typing import Optional

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        # Your solution here
        pass`,
      },
      {
        language: Language.GO,
        code: `type ListNode struct {
    Val  int
    Next *ListNode
}

func reverseList(head *ListNode) *ListNode {
    // Your solution here
    return nil
}`,
      },
      {
        language: Language.TYPESCRIPT,
        code: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val?: number, next?: ListNode | null) {
    this.val = val ?? 0;
    this.next = next ?? null;
  }
}

function reverseList(head: ListNode | null): ListNode | null {
  // Your solution here
  return null;
}`,
      },
    ],
    testCases: [
      { input: "1 2 3 4 5", output: "5 4 3 2 1", isHidden: false },
      { input: "1 2", output: "2 1", isHidden: false },
      { input: "", output: "", isHidden: true },
      { input: "7", output: "7", isHidden: true },
    ],
    officialSolution: {
      language: Language.JAVASCRIPT,
      code: `function reverseList(head) {
  let prev = null, curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}`,
      explanation: "## Iterative Reversal\n\nWalk the list maintaining `prev` and `curr`. At each step: save `curr.next`, point `curr.next` to `prev`, advance `prev` to `curr`, advance `curr` to saved next.",
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
    },
  },

  // ── EASY — SQL ────────────────────────────────────────────────────────
  {
    slug: "select-all-customers",
    title: "Select All Customers",
    difficulty: Difficulty.EASY,
    category: Category.SQL,
    isFree: true,
    isPremium: false,
    tags: ["sql", "select"],
    orderIndex: 9,
    description: `## Select All Customers

Table: \`Customers\`

\`\`\`
+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| id          | int     |
| name        | varchar |
| email       | varchar |
+-------------+---------+
\`\`\`

\`id\` is the primary key column for this table.

Write a SQL query to find **all customers**, returning their \`id\`, \`name\`, and \`email\`, ordered by \`id\` ascending.`,
    examples: [
      {
        input: "Customers table:\n+----+-------+---------------------+\n| id | name  | email               |\n+----+-------+---------------------+\n| 1  | Alice | alice@example.com   |\n| 2  | Bob   | bob@example.com     |\n| 3  | Carol | carol@example.com   |\n+----+-------+---------------------+",
        output: "+----+-------+---------------------+\n| id | name  | email               |\n+----+-------+---------------------+\n| 1  | Alice | alice@example.com   |\n| 2  | Bob   | bob@example.com     |\n| 3  | Carol | carol@example.com   |\n+----+-------+---------------------+",
      },
    ],
    constraints: {},
    hints: [
      "The SELECT statement retrieves rows from a table.",
      "Use SELECT id, name, email FROM Customers ORDER BY id;",
    ],
    starterCode: [
      {
        language: Language.SQL,
        code: `-- Write your SQL query here
SELECT `,
      },
    ],
    testCases: [
      { input: "SELECT id, name, email FROM Customers ORDER BY id", output: "1 Alice alice@example.com\n2 Bob bob@example.com", isHidden: false },
    ],
    officialSolution: {
      language: Language.SQL,
      code: `SELECT id, name, email
FROM Customers
ORDER BY id;`,
      explanation: "## Simple SELECT\n\nUse `SELECT` to choose columns and `FROM` to specify the table. `ORDER BY id` sorts results by the primary key.",
      timeComplexity: "O(n log n)",
      spaceComplexity: "O(n)",
    },
  },

  // ── HARD — Dynamic Programming ────────────────────────────────────────
  {
    slug: "climbing-stairs",
    title: "Climbing Stairs",
    difficulty: Difficulty.EASY,
    category: Category.DYNAMIC_PROGRAMMING,
    isFree: false,
    isPremium: false,
    tags: ["math", "dynamic-programming", "memoization"],
    orderIndex: 10,
    description: `## Climbing Stairs

You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?`,
    examples: [
      { input: "n = 2", output: "2", explanation: "There are two ways to climb to the top.\n1. 1 step + 1 step\n2. 2 steps" },
      { input: "n = 3", output: "3", explanation: "There are three ways to climb to the top.\n1. 1 step + 1 step + 1 step\n2. 1 step + 2 steps\n3. 2 steps + 1 step" },
    ],
    constraints: { "1 <= n <= 45": true },
    hints: [
      "The number of ways to reach step n depends on step n-1 and step n-2.",
      "This is essentially the Fibonacci sequence. Try bottom-up DP or just two variables.",
    ],
    starterCode: [
      {
        language: Language.JAVASCRIPT,
        code: `/**
 * @param {number} n
 * @return {number}
 */
function climbStairs(n) {
  // Your solution here
};`,
      },
      {
        language: Language.PYTHON,
        code: `class Solution:
    def climbStairs(self, n: int) -> int:
        # Your solution here
        pass`,
      },
      {
        language: Language.GO,
        code: `func climbStairs(n int) int {
    // Your solution here
    return 0
}`,
      },
      {
        language: Language.TYPESCRIPT,
        code: `function climbStairs(n: number): number {
  // Your solution here
  return 0;
}`,
      },
    ],
    testCases: [
      { input: "2", output: "2", isHidden: false },
      { input: "3", output: "3", isHidden: false },
      { input: "1", output: "1", isHidden: true },
      { input: "10", output: "89", isHidden: true },
      { input: "45", output: "1836311903", isHidden: true },
    ],
    officialSolution: {
      language: Language.JAVASCRIPT,
      code: `function climbStairs(n) {
  if (n <= 2) return n;
  let a = 1, b = 2;
  for (let i = 3; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}`,
      explanation: "## Bottom-Up DP (Fibonacci)\n\n`climbStairs(n) = climbStairs(n-1) + climbStairs(n-2)` — the same recurrence as Fibonacci. We only need the last two values, so O(1) space.",
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
    },
  },
];

// ── Playlist definitions ──────────────────────────────────────────────

const playlists = [
  {
    slug: "blind-75",
    title: "Blind 75",
    description:
      "The famous Blind 75 list — the most important 75 LeetCode problems curated by a Facebook engineer. Master these and you're ready for FAANG interviews.",
    isCurated: true,
    isPro: false,
    orderIndex: 1,
  },
  {
    slug: "top-sql-50",
    title: "Top SQL 50",
    description:
      "50 essential SQL problems covering SELECT, JOINs, aggregations, window functions, and subqueries. Perfect for data engineering and backend interviews.",
    isCurated: true,
    isPro: false,
    orderIndex: 2,
  },
  {
    slug: "go-interview-prep",
    title: "Go Interview Prep",
    description:
      "Idiomatic Go solutions to common algorithm problems. Learn goroutines, channels, interfaces, and the Go standard library through practical challenges.",
    isCurated: true,
    isPro: true,
    orderIndex: 3,
  },
  {
    slug: "system-design-essentials",
    title: "System Design Essentials",
    description:
      "Open-ended design questions covering URL shorteners, distributed caches, message queues, and scalable APIs. Includes rubric-based self-assessment.",
    isCurated: true,
    isPro: true,
    orderIndex: 4,
  },
  {
    slug: "behavioral-star-bank",
    title: "Behavioral STAR Bank",
    description:
      "50 behavioral interview prompts organized by competency. Write structured STAR-method responses and compare against expert examples.",
    isCurated: true,
    isPro: true,
    orderIndex: 5,
  },
];

// ── Seed function ──────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...");

  // Upsert playlists
  for (const pl of playlists) {
    await prisma.playlist.upsert({
      where: { slug: pl.slug },
      update: pl,
      create: pl,
    });
  }
  console.log(`✅ Seeded ${playlists.length} playlists`);

  // Upsert problems with relations
  for (const p of problems) {
    const { starterCode, testCases, officialSolution, ...problemData } = p;

    await prisma.problem.upsert({
      where: { slug: p.slug },
      update: {
        ...problemData,
        examples: problemData.examples as object,
        constraints: problemData.constraints as object,
        starterCode: {
          deleteMany: {},
          create: starterCode,
        },
        testCases: {
          deleteMany: {},
          create: testCases,
        },
        solutions: {
          deleteMany: {},
          create: [officialSolution],
        },
      },
      create: {
        ...problemData,
        examples: problemData.examples as object,
        constraints: problemData.constraints as object,
        starterCode: { create: starterCode },
        testCases: { create: testCases },
        solutions: { create: [officialSolution] },
      },
    });
    console.log(`  ✓ ${p.title}`);
  }
  console.log(`✅ Seeded ${problems.length} problems`);

  // Add first few problems to Blind 75 playlist
  const blind75 = await prisma.playlist.findUnique({ where: { slug: "blind-75" } });
  const sqlPlaylist = await prisma.playlist.findUnique({ where: { slug: "top-sql-50" } });
  const twoSum = await prisma.problem.findUnique({ where: { slug: "two-sum" } });
  const containsDup = await prisma.problem.findUnique({ where: { slug: "contains-duplicate" } });
  const groupAnagrams = await prisma.problem.findUnique({ where: { slug: "group-anagrams" } });
  const sqlProblem = await prisma.problem.findUnique({ where: { slug: "select-all-customers" } });

  if (blind75 && twoSum) {
    await prisma.playlistItem.upsert({
      where: { playlistId_problemId: { playlistId: blind75.id, problemId: twoSum.id } },
      update: { position: 1 },
      create: { playlistId: blind75.id, problemId: twoSum.id, position: 1 },
    });
  }
  if (blind75 && containsDup) {
    await prisma.playlistItem.upsert({
      where: { playlistId_problemId: { playlistId: blind75.id, problemId: containsDup.id } },
      update: { position: 2 },
      create: { playlistId: blind75.id, problemId: containsDup.id, position: 2 },
    });
  }
  if (blind75 && groupAnagrams) {
    await prisma.playlistItem.upsert({
      where: { playlistId_problemId: { playlistId: blind75.id, problemId: groupAnagrams.id } },
      update: { position: 3 },
      create: { playlistId: blind75.id, problemId: groupAnagrams.id, position: 3 },
    });
  }
  if (sqlPlaylist && sqlProblem) {
    await prisma.playlistItem.upsert({
      where: { playlistId_problemId: { playlistId: sqlPlaylist.id, problemId: sqlProblem.id } },
      update: { position: 1 },
      create: { playlistId: sqlPlaylist.id, problemId: sqlProblem.id, position: 1 },
    });
  }
  console.log("✅ Linked playlist items");

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
