import { checkMasterExclusion } from "./utils/master-exclusion-checker";

console.log("=".repeat(80));
console.log("COMPREHENSIVE EXCLUSION CHECKER TESTS");
console.log("=".repeat(80));

interface TestCase {
  category: string;
  practiceName: string;
  query: string;
  shouldExclude: boolean;
  expectedCategory?: string;
}

const testCases: TestCase[] = [
  // DSO Tests
  {
    category: "DSO",
    practiceName: "Aspen Dental Meridian",
    query: "Aspen Dental Meridian, 3270 N Eagle Rd, Merdian, ID",
    shouldExclude: true,
    expectedCategory: "DSO",
  },
  {
    category: "DSO",
    practiceName: "Heartland Dental Care",
    query: "Heartland Dental Care, 123 Main St, Chicago, IL",
    shouldExclude: true,
    expectedCategory: "DSO",
  },
  {
    category: "DSO",
    practiceName: "Western Dental",
    query: "Western Dental, 456 Oak Ave, Los Angeles, CA",
    shouldExclude: true,
    expectedCategory: "DSO",
  },
  {
    category: "DSO",
    practiceName: "Bright Now! Dental",
    query: "Bright Now Dental, 789 Pine Rd, Phoenix, AZ",
    shouldExclude: true,
    expectedCategory: "DSO",
  },

  // Government Tests
  {
    category: "Government",
    practiceName:
      "Bruce W. Carter Department of Veterans Affairs Medical Center",
    query:
      "Bruce W. Carter VA Medical Center, 1201 Northwest 16th Street, Miami, FL",
    shouldExclude: true,
    expectedCategory: "GOV",
  },
  {
    category: "Government",
    practiceName: "Naval Hospital Camp Pendleton Dental",
    query: "Naval Hospital Dental Clinic, Camp Pendleton, CA",
    shouldExclude: true,
    expectedCategory: "GOV",
  },
  {
    category: "Government",
    practiceName: "Army Dental Clinic Fort Bragg",
    query: "Army Dental Clinic, Fort Bragg, NC",
    shouldExclude: true,
    expectedCategory: "GOV",
  },
  {
    category: "Government",
    practiceName: "Indian Health Service Dental",
    query: "IHS Dental Clinic, Window Rock, AZ",
    shouldExclude: true,
    expectedCategory: "GOV",
  },

  // Educational Tests
  {
    category: "Educational",
    practiceName: "Spotsylvania Career and Technical Center",
    query: "Spotsylvania Voc Center, 6713 Smith Station Rd, VA",
    shouldExclude: true,
    expectedCategory: "EDU",
  },
  {
    category: "Educational",
    practiceName: "UCLA School of Dentistry",
    query: "UCLA Dental School, Los Angeles, CA",
    shouldExclude: true,
    expectedCategory: "EDU",
  },
  {
    category: "Educational",
    practiceName: "University of Michigan Dental Clinic",
    query: "University of Michigan Dental Clinic, Ann Arbor, MI",
    shouldExclude: true,
    expectedCategory: "EDU",
  },
  {
    category: "Educational",
    practiceName: "Community College Dental Hygiene Program",
    query: "Community College Dental Hygiene, Springfield, MA",
    shouldExclude: true,
    expectedCategory: "EDU",
  },

  // Clinic Tests
  {
    category: "Clinic",
    practiceName: "Community Health Center Dental",
    query: "Community Health Center, 111 Center St, Detroit, MI",
    shouldExclude: true,
    expectedCategory: "CLINIC",
  },
  {
    category: "Clinic",
    practiceName: "Free Dental Clinic",
    query: "Free Dental Clinic, 222 Hope Ave, Portland, OR",
    shouldExclude: true,
    expectedCategory: "CLINIC",
  },
  {
    category: "Clinic",
    practiceName: "Mobile Dental Van Services",
    query: "Mobile Dental Services, Seattle, WA",
    shouldExclude: true,
    expectedCategory: "CLINIC",
  },

  // Valid Private Practices (Should NOT be excluded)
  {
    category: "Valid",
    practiceName: "Smith Family Dentistry",
    query: "Smith Family Dentistry, 123 Main St, Anytown, CA",
    shouldExclude: false,
  },
  {
    category: "Valid",
    practiceName: "Johnson & Associates Dental",
    query: "Johnson & Associates, 456 Oak Dr, Springfield, IL",
    shouldExclude: false,
  },
  {
    category: "Valid",
    practiceName: "Bright Smile Dental Care",
    query: "Bright Smile Dental, 789 Elm St, Austin, TX",
    shouldExclude: false,
  },
];

let passed = 0;
let failed = 0;
const failures: string[] = [];

testCases.forEach((test, index) => {
  console.log(`\n${"-".repeat(80)}`);
  console.log(
    `Test ${index + 1}/${testCases.length}: ${test.category} - ${test.practiceName}`,
  );
  console.log(`Query: "${test.query}"`);

  const result = checkMasterExclusion(test.practiceName, test.query);

  const testPassed =
    result.isExcluded === test.shouldExclude &&
    (!test.expectedCategory || result.category === test.expectedCategory);

  if (testPassed) {
    console.log(`✅ PASS`);
    if (result.isExcluded) {
      console.log(`   Reason: ${result.reason}`);
    }
    passed++;
  } else {
    console.log(`❌ FAIL`);
    console.log(
      `   Expected: ${test.shouldExclude ? "EXCLUDE" : "ALLOW"} (${test.expectedCategory || "N/A"})`,
    );
    console.log(
      `   Got: ${result.isExcluded ? "EXCLUDE" : "ALLOW"} (${result.category || "N/A"})`,
    );
    console.log(`   Reason: ${result.reason}`);
    failed++;
    failures.push(`Test ${index + 1}: ${test.practiceName}`);
  }
});

console.log(`\n${"=".repeat(80)}`);
console.log("SUMMARY");
console.log("=".repeat(80));
console.log(`Total Tests: ${testCases.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failures.length > 0) {
  console.log(`\nFailed Tests:`);
  failures.forEach((f) => console.log(`  - ${f}`));
}

console.log("=".repeat(80));

// Exit with non-zero code if any tests failed
process.exit(failed > 0 ? 1 : 0);
