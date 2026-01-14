# TEST-PLAN: Reports & Dashboard

Generated: 2026-01-10 18:30:00
Spec Source: specs/001-service-invoice-accounting/
Database: Firebase
App URL: http://localhost:3000

---

## Overview

This test plan covers the Dashboard (Reports) feature which displays:
- Dashboard Stats (KPI cards)
- Revenue Chart (monthly trends)
- Service Revenue Breakdown (by type)
- Most Used Services
- Services by Type distribution
- Recent Activity Feed

**Pages to Test:**
- `/[locale]/(dashboard)/dashboard` - Main dashboard with all reports

**Key Components:**
- `DashboardStats` - 6 KPI cards
- `RevenueChart` - Monthly revenue visualization
- `ServiceRevenueBreakdown` - Revenue by service type
- `MostUsedServices` - Top services list
- `ServicesByType` - Service type distribution
- `RecentActivityFeed` - Recent transactions

---

## Pre-Test: Authentication

| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| AUTH-1 | Login | Navigate to /ar/login → Enter hossamsharif1990@gmail.com / Hossam1990@ → Submit | Dashboard loads | Chrome | [ ] |

### **HARD STOP** - Auth Checkpoint
- [ ] Logged in successfully
- [ ] Can access dashboard

---

## Section 1: Dashboard Page - UI Tests

### Page Load Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| DASH-UI-1 | Page loads | Navigate to /ar/dashboard | Dashboard page renders | Chrome | [ ] |
| DASH-UI-2 | Page title | Check page title | "لوحة التحكم" or "Dashboard" | Chrome | [ ] |
| DASH-UI-3 | Page description | Check subtitle | Description text visible | Chrome | [ ] |
| DASH-UI-4 | Loading state | Check initial load | Loading indicators shown | Chrome | [ ] |
| DASH-UI-5 | Error handling | Simulate error | Error alert with retry button | Chrome | [ ] |

### Layout Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| DASH-LAY-1 | Stats cards row | Check stats section | 6 KPI cards displayed | Chrome | [ ] |
| DASH-LAY-2 | Charts row | Check charts section | 2 charts side-by-side | Chrome | [ ] |
| DASH-LAY-3 | Analytics row | Check bottom section | Service analytics + activity feed | Chrome | [ ] |
| DASH-LAY-4 | Responsive grid | Check layout | Grid adapts to screen size | Chrome | [ ] |

---

## Section 2: Dashboard Stats (KPI Cards)

### Stats Display Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| STATS-1 | Total revenue card | Check first card | Shows "إجمالي الإيرادات" with amount | Chrome | [ ] |
| STATS-2 | Total invoices card | Check second card | Shows "إجمالي الفواتير" with count | Chrome | [ ] |
| STATS-3 | Total customers card | Check third card | Shows "إجمالي العملاء" with count | Chrome | [ ] |
| STATS-4 | Active services card | Check fourth card | Shows "الخدمات النشطة" with count | Chrome | [ ] |
| STATS-5 | Pending payments card | Check fifth card | Shows "المدفوعات المعلقة" with amount | Chrome | [ ] |
| STATS-6 | Pending commissions card | Check sixth card | Shows "العمولات المعلقة" with amount | Chrome | [ ] |

### Stats Formatting Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| STATS-FMT-1 | Currency display | Check revenue card | Currency formatted (e.g., "1,234.56 USD") | Chrome | [ ] |
| STATS-FMT-2 | Number formatting | Check counts | Numbers formatted with commas | Chrome | [ ] |
| STATS-FMT-3 | Change indicators | Check trend arrows | Up/down arrows with percentages | Chrome | [ ] |
| STATS-FMT-4 | Zero values | Check with no data | Shows "0" or "-" | Chrome | [ ] |

### Stats Icons Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| STATS-ICO-1 | Revenue icon | Check card | Dollar/currency icon visible | Chrome | [ ] |
| STATS-ICO-2 | Invoices icon | Check card | Document/invoice icon visible | Chrome | [ ] |
| STATS-ICO-3 | Customers icon | Check card | Users/people icon visible | Chrome | [ ] |
| STATS-ICO-4 | Services icon | Check card | Service/tools icon visible | Chrome | [ ] |
| STATS-ICO-5 | Payments icon | Check card | Payment/wallet icon visible | Chrome | [ ] |
| STATS-ICO-6 | Commissions icon | Check card | Commission/percent icon visible | Chrome | [ ] |

---

## Section 3: Revenue Chart

### Chart Display Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| REV-CH-1 | Chart renders | Check chart section | Revenue chart visible | Chrome | [ ] |
| REV-CH-2 | Chart title | Check header | "الإيرادات الشهرية" or similar | Chrome | [ ] |
| REV-CH-3 | Chart type | Check visualization | Line or bar chart | Chrome | [ ] |
| REV-CH-4 | X-axis labels | Check months | Month names visible | Chrome | [ ] |
| REV-CH-5 | Y-axis labels | Check values | Revenue amounts visible | Chrome | [ ] |
| REV-CH-6 | Data points | Check chart | Data points plotted | Chrome | [ ] |
| REV-CH-7 | Empty state | If no data | Empty state message shown | Chrome | [ ] |

### Chart Interaction Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| REV-INT-1 | Hover tooltip | Hover over data point | Tooltip shows month + amount | Chrome | [ ] |
| REV-INT-2 | Legend | Check legend | Legend items visible | Chrome | [ ] |
| REV-INT-3 | Currency in tooltip | Hover tooltip | Currency displayed | Chrome | [ ] |

---

## Section 4: Service Revenue Breakdown

### Breakdown Display Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SRV-BRK-1 | Chart renders | Check breakdown section | Service revenue chart visible | Chrome | [ ] |
| SRV-BRK-2 | Chart title | Check header | "توزيع الإيرادات حسب نوع الخدمة" or similar | Chrome | [ ] |
| SRV-BRK-3 | Chart type | Check visualization | Pie or donut chart | Chrome | [ ] |
| SRV-BRK-4 | Service types | Check segments | Visa, Ticket, Hotel, Insurance, Other | Chrome | [ ] |
| SRV-BRK-5 | Colors | Check segments | Different colors for each type | Chrome | [ ] |
| SRV-BRK-6 | Empty state | If no data | Empty state message shown | Chrome | [ ] |

### Breakdown Interaction Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SRV-BRK-INT-1 | Hover tooltip | Hover over segment | Tooltip shows type + amount + % | Chrome | [ ] |
| SRV-BRK-INT-2 | Legend | Check legend | Service type legend visible | Chrome | [ ] |
| SRV-BRK-INT-3 | Percentages | Check display | Percentages shown | Chrome | [ ] |

---

## Section 5: Most Used Services

### Services List Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| MOST-SRV-1 | List renders | Check section | Most used services list visible | Chrome | [ ] |
| MOST-SRV-2 | Section title | Check header | "الخدمات الأكثر استخدامًا" or similar | Chrome | [ ] |
| MOST-SRV-3 | Service items | Check list | Service rows displayed | Chrome | [ ] |
| MOST-SRV-4 | Service name | Check item | Service name visible | Chrome | [ ] |
| MOST-SRV-5 | Usage count | Check item | Usage count displayed | Chrome | [ ] |
| MOST-SRV-6 | Service type | Check item | Type badge visible | Chrome | [ ] |
| MOST-SRV-7 | Empty state | If no services | Empty state message shown | Chrome | [ ] |

### Services Sorting Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| MOST-SRV-SRT-1 | Sorted by usage | Check order | Most used at top | Chrome | [ ] |
| MOST-SRV-SRT-2 | Limit display | Check count | Shows top 5-10 services | Chrome | [ ] |

---

## Section 6: Services by Type

### Type Distribution Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SRV-TYPE-1 | Component renders | Check section | Services by type visible | Chrome | [ ] |
| SRV-TYPE-2 | Section title | Check header | "الخدمات حسب النوع" or similar | Chrome | [ ] |
| SRV-TYPE-3 | Type counts | Check display | Visa, Ticket, Hotel, Insurance, Other counts | Chrome | [ ] |
| SRV-TYPE-4 | Visual representation | Check display | Bars, icons, or badges | Chrome | [ ] |
| SRV-TYPE-5 | Empty state | If no services | Shows all types with 0 | Chrome | [ ] |

### Type Formatting Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| SRV-TYPE-FMT-1 | Type icons | Check display | Icons for each type | Chrome | [ ] |
| SRV-TYPE-FMT-2 | Count format | Check numbers | Numbers formatted | Chrome | [ ] |
| SRV-TYPE-FMT-3 | Type labels | Check text | Type names translated | Chrome | [ ] |

---

## Section 7: Recent Activity Feed

### Activity Display Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ACT-FEED-1 | Feed renders | Check section | Activity feed visible | Chrome | [ ] |
| ACT-FEED-2 | Section title | Check header | "النشاط الأخير" or similar | Chrome | [ ] |
| ACT-FEED-3 | Activity items | Check list | Recent activities displayed | Chrome | [ ] |
| ACT-FEED-4 | Activity icon | Check item | Icon for activity type | Chrome | [ ] |
| ACT-FEED-5 | Activity description | Check item | Description text visible | Chrome | [ ] |
| ACT-FEED-6 | Timestamp | Check item | Time/date displayed | Chrome | [ ] |
| ACT-FEED-7 | Amount | Check item | Amount shown for financial activities | Chrome | [ ] |
| ACT-FEED-8 | Empty state | If no activities | Empty state message shown | Chrome | [ ] |

### Activity Types Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ACT-TYPE-1 | Invoice created | Check activity | Invoice icon + description | Chrome | [ ] |
| ACT-TYPE-2 | Payment received | Check activity | Payment icon + description | Chrome | [ ] |
| ACT-TYPE-3 | Customer added | Check activity | Customer icon + description | Chrome | [ ] |
| ACT-TYPE-4 | Partner payment | Check activity | Partner icon + description | Chrome | [ ] |
| ACT-TYPE-5 | Service added | Check activity | Service icon + description | Chrome | [ ] |

### Activity Formatting Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ACT-FMT-1 | Relative time | Check timestamps | "منذ 5 دقائق", "منذ ساعة", etc. | Chrome | [ ] |
| ACT-FMT-2 | Amount format | Check amounts | Currency formatted | Chrome | [ ] |
| ACT-FMT-3 | User attribution | Check description | Shows who performed action | Chrome | [ ] |

---

## Section 8: i18n Tests (Arabic)

### Translation Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| i18n-AR-1 | Page title | Check /ar/dashboard | "لوحة التحكم" | Chrome | [ ] |
| i18n-AR-2 | Page description | Check subtitle | Arabic description | Chrome | [ ] |
| i18n-AR-3 | Stats labels | Check all cards | All labels in Arabic | Chrome | [ ] |
| i18n-AR-4 | Chart titles | Check charts | Arabic chart titles | Chrome | [ ] |
| i18n-AR-5 | Service types | Check breakdown | Types in Arabic | Chrome | [ ] |
| i18n-AR-6 | Activity feed | Check descriptions | Activities in Arabic | Chrome | [ ] |
| i18n-AR-7 | Empty states | Check messages | Arabic empty messages | Chrome | [ ] |
| i18n-AR-8 | Error messages | Trigger error | Arabic error text | Chrome | [ ] |

### No Raw Keys Test
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| i18n-RAW-1 | Scan for raw keys | Search page for "reports.", "dashboard.", etc. | No raw translation keys visible | Chrome | [ ] |

---

## Section 9: i18n Tests (English)

### Translation Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| i18n-EN-1 | Page title | Check /en/dashboard | "Dashboard" | Chrome | [ ] |
| i18n-EN-2 | Stats labels | Check all cards | All labels in English | Chrome | [ ] |
| i18n-EN-3 | Chart titles | Check charts | English chart titles | Chrome | [ ] |
| i18n-EN-4 | Service types | Check breakdown | Types in English | Chrome | [ ] |

---

## Section 10: Data Accuracy Tests

### Data Verification Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| DATA-1 | Revenue matches | Compare with invoices | Total revenue = sum of invoice totals | Chrome + Firebase | [ ] |
| DATA-2 | Invoice count | Compare with DB | Invoice count matches DB | Chrome + Firebase | [ ] |
| DATA-3 | Customer count | Compare with DB | Customer count matches DB | Chrome + Firebase | [ ] |
| DATA-4 | Service count | Compare with DB | Active services count matches DB | Chrome + Firebase | [ ] |
| DATA-5 | Pending payments | Compare with invoices | Pending = issued + partial invoices | Chrome + Firebase | [ ] |
| DATA-6 | Pending commissions | Compare with DB | Commissions = unsettled partner services | Chrome + Firebase | [ ] |

### Calculation Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| CALC-1 | Revenue by month | Check chart data | Monthly totals correct | Chrome + Firebase | [ ] |
| CALC-2 | Revenue by type | Check breakdown | Type totals = 100% | Chrome + Firebase | [ ] |
| CALC-3 | Service usage | Check most used | Usage counts correct | Chrome + Firebase | [ ] |
| CALC-4 | Type distribution | Check counts | Sum = total services | Chrome + Firebase | [ ] |

---

## Section 11: Responsive Design Tests

### Desktop Tests (1920x1080)
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| RESP-DT-1 | Stats cards | Resize 1920x1080 | 3 cards per row (2 rows) | Chrome | [ ] |
| RESP-DT-2 | Charts row | Check layout | 2 charts side-by-side | Chrome | [ ] |
| RESP-DT-3 | Bottom row | Check layout | 2 columns (analytics + feed) | Chrome | [ ] |
| RESP-DT-4 | All content visible | Scroll page | No horizontal scroll | Chrome | [ ] |

### Mobile Tests (375x812)
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| RESP-MOB-1 | Stats cards | Resize 375x812 | 1-2 cards per row | Chrome | [ ] |
| RESP-MOB-2 | Charts stacked | Check layout | Charts stack vertically | Chrome | [ ] |
| RESP-MOB-3 | Bottom stacked | Check layout | Analytics + feed stack vertically | Chrome | [ ] |
| RESP-MOB-4 | Touch targets | Check buttons | Buttons large enough to tap | Chrome | [ ] |
| RESP-MOB-5 | Text readable | Check all text | Text not truncated | Chrome | [ ] |
| RESP-MOB-6 | Charts responsive | Check charts | Charts fit mobile width | Chrome | [ ] |

---

## Section 12: RTL Layout Tests

### RTL Alignment Tests (Arabic)
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| RTL-1 | Page direction | Check /ar/dashboard | dir="rtl" | Chrome | [ ] |
| RTL-2 | Stats cards | Check alignment | Icons on right, text on left | Chrome | [ ] |
| RTL-3 | Charts | Check layout | Charts mirror for RTL | Chrome | [ ] |
| RTL-4 | Activity feed | Check alignment | Icons on right, text on left | Chrome | [ ] |
| RTL-5 | Numbers | Check display | Numbers display correctly | Chrome | [ ] |

---

## Section 13: Loading States

### Loading Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| LOAD-1 | Initial load | Refresh page | Loading skeletons shown | Chrome | [ ] |
| LOAD-2 | Stats loading | Check cards | Skeleton cards visible | Chrome | [ ] |
| LOAD-3 | Charts loading | Check charts | Chart skeleton visible | Chrome | [ ] |
| LOAD-4 | Feed loading | Check activity | Feed skeleton visible | Chrome | [ ] |
| LOAD-5 | Smooth transition | Wait for load | Content fades in smoothly | Chrome | [ ] |

---

## Section 14: Error Handling

### Error Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| ERR-1 | Network error | Simulate offline | Error alert displayed | Chrome | [ ] |
| ERR-2 | Retry button | Click retry | Data refetches | Chrome | [ ] |
| ERR-3 | Error message | Check alert | Clear error message | Chrome | [ ] |
| ERR-4 | Graceful degradation | Error state | Dashboard structure remains | Chrome | [ ] |

---

## Section 15: Performance Tests

### Performance Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| PERF-1 | Initial load time | Measure load | Page loads < 3 seconds | Chrome | [ ] |
| PERF-2 | Data fetch time | Measure fetch | Data loads < 2 seconds | Chrome | [ ] |
| PERF-3 | Chart render | Measure render | Charts render < 1 second | Chrome | [ ] |
| PERF-4 | No layout shift | Watch load | Minimal CLS | Chrome | [ ] |

---

## Section 16: Integration Tests

### Cross-Feature Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| INT-1 | Create invoice → Dashboard | Create invoice → Check dashboard | Revenue increases | Chrome + Firebase | [ ] |
| INT-2 | Add customer → Dashboard | Add customer → Check dashboard | Customer count increases | Chrome + Firebase | [ ] |
| INT-3 | Record payment → Dashboard | Record payment → Check dashboard | Pending payments decrease | Chrome + Firebase | [ ] |
| INT-4 | Add service → Dashboard | Add service → Check dashboard | Active services increase | Chrome + Firebase | [ ] |
| INT-5 | Activity feed updates | Perform action | New activity appears | Chrome | [ ] |

---

## Section 17: Edge Cases

### Edge Case Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| EDGE-1 | No data | Fresh workspace | All sections show empty states | Chrome | [ ] |
| EDGE-2 | Large numbers | Many invoices | Numbers formatted with K/M | Chrome | [ ] |
| EDGE-3 | Long service names | Check most used | Names truncated with tooltip | Chrome | [ ] |
| EDGE-4 | Zero revenue | No paid invoices | Shows 0 gracefully | Chrome | [ ] |
| EDGE-5 | All services same type | Check breakdown | 100% in one segment | Chrome | [ ] |
| EDGE-6 | Old activities | Check feed | Dates format correctly | Chrome | [ ] |

---

## Section 18: Navigation Tests

### Navigation Tests
| ID | Test | Steps | Expected | Tool | Status |
|----|------|-------|----------|------|--------|
| NAV-1 | Sidebar link | Click Dashboard in sidebar | Navigates to dashboard | Chrome | [ ] |
| NAV-2 | Logo click | Click logo | Returns to dashboard | Chrome | [ ] |
| NAV-3 | URL access | Type /ar/dashboard | Dashboard loads | Chrome | [ ] |
| NAV-4 | Activity click | Click activity item | Navigates to detail (if clickable) | Chrome | [ ] |

---

## **HARD STOP** - Reports/Dashboard Complete

- [ ] All UI elements render correctly
- [ ] Data accuracy verified
- [ ] Charts display correctly
- [ ] Activity feed works
- [ ] i18n complete (Arabic + English)
- [ ] RTL layout correct
- [ ] Mobile responsive
- [ ] No raw translation keys
- [ ] Loading states work
- [ ] Error handling works

---

## Success Criteria

### Completion Checklist
- [ ] All test cases executed
- [ ] All HARD STOPs verified
- [ ] All fixes committed
- [ ] TEST-REPORT-Reports.md generated
- [ ] Screenshots saved for failures
- [ ] `<promise>ALL_TESTS_COMPLETE</promise>` output

### Test Summary
| Section | Total Tests |
|---------|-------------|
| Dashboard UI | 9 |
| Dashboard Stats | 18 |
| Revenue Chart | 10 |
| Service Breakdown | 9 |
| Most Used Services | 9 |
| Services by Type | 8 |
| Activity Feed | 16 |
| i18n Arabic | 9 |
| i18n English | 4 |
| Data Accuracy | 10 |
| Responsive Design | 10 |
| RTL Layout | 5 |
| Loading States | 5 |
| Error Handling | 4 |
| Performance | 4 |
| Integration | 5 |
| Edge Cases | 6 |
| Navigation | 4 |
| **TOTAL** | **145** |

---

## Notes

- Dashboard is the main entry point after login
- Uses `useFinanceDashboard` hook for data fetching
- All charts should be responsive and interactive
- Empty states should be informative
- Currency should be consistent across all displays
- Activity feed should show most recent first (limit 10-20)
- Performance is critical - dashboard should load fast
- Data should refresh on actions in other modules

---

## Test Execution Protocol

1. Login with test account
2. Execute each section sequentially
3. Mark tests as [x] when passed
4. Take screenshots on failure
5. Fix issues immediately
6. Commit fixes with: `git commit -m "fix(dashboard): [description]"`
7. Re-test after fixes
8. Stop at HARD STOP markers to verify
9. Continue only when all tests in section pass
10. Generate TEST-REPORT-Reports.md at end
