/* Rift audits a returned unusual-options sample. It never infers trade direction
 * from CALL/PUT, links separate trades into orders, or reconstructs history. */
function riftNumber(riftValue) {
  return typeof riftValue === 'number' && Number.isFinite(riftValue);
}
function riftSeconds(riftValue) {
  if (!riftNumber(riftValue) || riftValue <= 0) return null;
  return riftValue > 1e11 ? riftValue / 1000 : riftValue;
}
function riftTag(riftTags) {
  const riftList = Array.isArray(riftTags) ? riftTags.filter(riftItem => typeof riftItem === 'string').map(riftItem => riftItem.toLowerCase().trim()) : [];
  const riftBull = riftList.includes('bullish');
  const riftBear = riftList.includes('bearish');
  const riftNeutral = riftList.includes('neutral');
  return riftBull && !riftBear && !riftNeutral ? 'bull' : riftBear && !riftBull && !riftNeutral ? 'bear' : 'other';
}
function riftClass(riftBalance, riftThreshold) {
  return riftBalance === null ? null : riftBalance >= riftThreshold ? 1 : riftBalance <= -riftThreshold ? -1 : 0;
}
function calculateRift(riftRaw, riftOptions = {}) {
  const riftAsOf = riftOptions.asOf ?? Date.now();
  const riftTicker = String(riftOptions.ticker || '').toUpperCase().trim();
  const riftDays = Math.max(1, Math.min(30, Number(riftOptions.days) || 7));
  const riftThreshold = Math.max(0.01, Math.min(0.4, Number(riftOptions.threshold) || 0.1));
  const riftGrouping = riftOptions.grouping === 'Expiry' ? 'Expiry' : 'Contract';
  const riftBase = { ticker: riftTicker, asOf: riftAsOf, days: riftDays, threshold: riftThreshold, grouping: riftGrouping,
    ready: false, status: 'DATA UNAVAILABLE', message: '', groups: [], scenarios: [], latest: null,
    flags: { fragile: false, flips: false, concentrated: false }, audit: { returned: 0, accepted: 0, outside: 0, invalid: 0, duplicates: 0, conflicts: 0, unidentified: 0 } };
  if (!['stock','stock_otc','etf'].includes(riftOptions.assetType || 'stock')) return { ...riftBase, status: 'EQUITIES & ETFS ONLY', message: 'Use an underlying equity or ETF with unusual-options records.' };
  if (!Array.isArray(riftRaw)) return { ...riftBase, message: 'The included unusual-options request failed. No sample conclusion is available.' };
  const riftAudit = { ...riftBase.audit, returned: riftRaw.length };
  const riftStart = riftAsOf / 1000 - riftDays * 86400;
  const riftRows = [];
  const riftIds = {};
  for (let riftIndex = 0; riftIndex < riftRaw.length; riftIndex += 1) {
    const riftRecord = riftRaw[riftIndex];
    if (!riftRecord || typeof riftRecord !== 'object') { riftAudit.invalid += 1; continue; }
    const riftStamp = riftSeconds(riftRecord.timestamp);
    const riftExpiry = riftSeconds(riftRecord.expDate);
    const riftType = String(riftRecord.type || '').toUpperCase();
    const riftRecordTicker = String(riftRecord.ticker || riftTicker).toUpperCase().trim();
    if (riftStamp === null || riftExpiry === null || riftStamp > riftAsOf / 1000 ||
      riftStamp < 946684800 || riftExpiry < riftStamp - 86400 || riftRecordTicker !== riftTicker ||
      !['CALL','PUT'].includes(riftType) || !riftNumber(riftRecord.strike) || riftRecord.strike <= 0 ||
      !riftNumber(riftRecord.costBasis) || riftRecord.costBasis <= 0) { riftAudit.invalid += 1; continue; }
    if (riftStamp < riftStart) { riftAudit.outside += 1; continue; }
    const riftExpiryDay = Math.floor(riftExpiry / 86400);
    const riftId = typeof riftRecord.id === 'string' && riftRecord.id.trim() ? riftRecord.id.trim() : null;
    const riftBucket = riftTag(riftRecord.tags);
    const riftContract = riftTicker + '|' + riftExpiryDay + '|' + riftType + '|' + riftRecord.strike;
    const riftFingerprint = [riftStamp, riftExpiryDay, riftType, riftRecord.strike, riftRecord.costBasis, riftBucket, riftRecordTicker].join('|');
    const riftRow = { id: riftId, timestamp: riftStamp, expiryDay: riftExpiryDay, contract: riftContract,
      expiryLabel: String(riftRecord.expDateFormatted || ('expiry day ' + riftExpiryDay)),
      type: riftType, strike: riftRecord.strike, premium: riftRecord.costBasis, bucket: riftBucket, fingerprint: riftFingerprint, conflict: false };
    if (riftId !== null && ('id:' + riftId) in riftIds) {
      const riftPrior = riftIds['id:' + riftId];
      if (riftPrior.fingerprint === riftFingerprint && !riftPrior.conflict) riftAudit.duplicates += 1;
      else { riftPrior.conflict = true; riftAudit.conflicts += 1; }
      continue;
    }
    if (riftId !== null) riftIds['id:' + riftId] = riftRow;
    else riftAudit.unidentified += 1;
    riftRows.push(riftRow);
  }
  const riftAccepted = riftRows.filter(riftRow => !riftRow.conflict).sort((riftA, riftB) => riftA.timestamp - riftB.timestamp);
  riftAudit.accepted = riftAccepted.length;
  if (!riftAccepted.length) return { ...riftBase, audit: riftAudit, status: 'NO USABLE RECORDS', message: 'No usable returned events fall inside the requested window. Missing is not zero flow.' };
  const riftMap = {};
  const riftContracts = {};
  let riftTotal = 0, riftBull = 0, riftBear = 0, riftOther = 0;
  for (const riftRow of riftAccepted) {
    const riftKey = riftGrouping === 'Expiry' ? String(riftRow.expiryDay) : riftRow.contract;
    if (!(riftKey in riftMap)) riftMap[riftKey] = { key: riftKey, label: riftGrouping === 'Expiry' ? riftRow.expiryLabel : riftRow.strike + ' ' + (riftRow.type === 'CALL' ? 'C' : 'P') + ' · ' + riftRow.expiryLabel,
      expiryDay: riftRow.expiryDay, strike: riftGrouping === 'Expiry' ? null : riftRow.strike, type: riftGrouping === 'Expiry' ? null : riftRow.type,
      premium: 0, bull: 0, bear: 0, other: 0, records: 0, contracts: {} };
    const riftGroup = riftMap[riftKey];
    riftGroup.premium += riftRow.premium; riftGroup[riftRow.bucket] += riftRow.premium; riftGroup.records += 1;
    riftGroup.contracts[riftRow.contract] = true; riftContracts[riftRow.contract] = true;
    riftTotal += riftRow.premium;
    if (riftRow.bucket === 'bull') riftBull += riftRow.premium;
    else if (riftRow.bucket === 'bear') riftBear += riftRow.premium;
    else riftOther += riftRow.premium;
  }
  if (!Number.isFinite(riftTotal)) return { ...riftBase, audit: riftAudit, status: 'INVALID PREMIUM SCALE', message: 'Returned premium amounts cannot be summed safely.' };
  const riftGroups = Object.values(riftMap).map(riftGroup => ({ ...riftGroup, contracts: Object.keys(riftGroup.contracts).length,
    share: riftGroup.premium / riftTotal })).sort((riftA, riftB) => riftB.premium - riftA.premium || riftA.key.localeCompare(riftB.key));
  const riftBalance = (riftBull - riftBear) / riftTotal;
  const riftLead = riftClass(riftBalance, riftThreshold);
  const riftScenarios = riftGroups.map(riftGroup => {
    const riftRemaining = riftTotal - riftGroup.premium;
    const riftAfter = riftRemaining > Math.max(1e-8, riftTotal * 1e-12) ? ((riftBull - riftGroup.bull) - (riftBear - riftGroup.bear)) / riftRemaining : null;
    return { key: riftGroup.key, label: riftGroup.label, share: riftGroup.share, balance: riftAfter, lead: riftClass(riftAfter, riftThreshold) };
  });
  const riftValidScenarios = riftScenarios.filter(riftScenario => riftScenario.balance !== null);
  const riftLow = riftValidScenarios.length ? Math.min(...riftValidScenarios.map(riftScenario => riftScenario.balance)) : null;
  const riftHigh = riftValidScenarios.length ? Math.max(...riftValidScenarios.map(riftScenario => riftScenario.balance)) : null;
  const riftPivotal = riftScenarios.filter(riftScenario => riftScenario.lead !== null && riftScenario.lead !== riftLead);
  const riftFlips = riftLead !== 0 && riftScenarios.some(riftScenario => riftScenario.lead === -riftLead);
  const riftNewest = riftAccepted[riftAccepted.length - 1].timestamp;
  const riftAgeHours = (riftAsOf / 1000 - riftNewest) / 3600;
  const riftStale = riftAgeHours > 36;
  const riftTagShare = (riftBull + riftBear) / riftTotal;
  const riftReady = !riftStale && !riftAudit.invalid && !riftAudit.conflicts && !riftAudit.unidentified && riftAccepted.length >= 10 && riftGroups.length >= 3 && riftTagShare >= 0.5;
  const riftLargest = riftGroups.filter(riftGroup => Math.abs(riftGroup.premium - riftGroups[0].premium) <= riftTotal * 1e-12);
  const riftLargestScenarios = riftScenarios.filter(riftScenario => riftLargest.some(riftGroup => riftGroup.key === riftScenario.key));
  const riftStatus = riftStale ? 'OLDER SAMPLE · FLAGS OFF' : riftAudit.invalid || riftAudit.conflicts || riftAudit.unidentified ? 'DATA QUALITY LIMIT · FLAGS OFF'
    : riftAccepted.length < 10 || riftGroups.length < 3 ? 'SMALL SAMPLE · FLAGS OFF' : riftTagShare < 0.5 ? 'MOSTLY UNCLASSIFIED · FLAGS OFF'
    : riftLead === 0 ? riftPivotal.length ? 'NO BASE LEAD · OMISSION CREATES ONE' : 'NO MATERIAL TAGGED LEAD' : riftFlips ? 'TAGGED LEAD CAN FLIP' : riftPivotal.length ? 'TAGGED LEAD CAN DISSOLVE' : 'TAGGED LEAD HOLDS IN THIS TEST';
  return { ...riftBase, ready: riftReady, status: riftStatus,
    message: 'Remove each ' + riftGrouping.toLowerCase() + ' in turn. This tests concentration in the returned sample, not trader conviction or future prices.',
    audit: riftAudit, groups: riftGroups, scenarios: riftScenarios, largest: riftLargestScenarios, low: riftLow, high: riftHigh, pivotal: riftPivotal.length,
    total: riftTotal, bull: riftBull, bear: riftBear, other: riftOther, balance: riftBalance, lead: riftLead,
    effective: 1 / riftGroups.reduce((riftA, riftGroup) => riftA + riftGroup.share * riftGroup.share, 0),
    contractCount: Object.keys(riftContracts).length, latest: riftNewest, oldest: riftAccepted[0].timestamp,
    ageHours: riftAgeHours, stale: riftStale, tagShare: riftTagShare,
    flags: { fragile: riftReady && riftPivotal.length > 0, flips: riftReady && riftFlips, concentrated: riftReady && riftGroups[0].share >= 0.5 } };
}
