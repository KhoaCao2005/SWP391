import axios from 'axios';
import { handleAuthError } from './inventoryService';

// Use the same API base as other manager services
const API_URL = import.meta.env.VITE_API_URL;

const withBase = (path) => {
  const base = (API_URL || '').endsWith('/') ? API_URL.slice(0, -1) : (API_URL || '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
};

export async function fetchDealerSalesRecords({ startDate, endDate }) {
  try {
    const token = localStorage.getItem('token');
    // API_URL already includes '/api'
    const url = `${API_URL}/manager/dealerSalesRecords`;
    const res = await axios.post(
      url,
      { startDate, endDate },
      { headers: { Authorization: `Bearer ${token}`, ...(API_URL?.includes('ngrok') ? { 'ngrok-skip-browser-warning': 'true' } : {}) } }
    );
    const payload = res?.data;
    const list = payload?.data || [];
    // The backend returns SaleRecordDTO: { saleId, dealerStaffId, saleDate, saleAmount }
    // We normalize to a structure the UI can render without guessing extra fields.
    // Aggregate by dealerStaffId to compute totals and counts; keep records as details.
    const byStaff = new Map();
    for (const r of list) {
      // Support multiple BE shapes for staff id and username
      const resolvedStaffId =
        r.dealerStaffId ??
        r.staffId ??
        r.dealerStaff?.dealerStaffId ??
        r.dealerStaff?.id ??
        r.staff?.id ??
        r.staff?.staffId ??
        r.userAccount?.userId ??
        r.user?.id ??
        '';
      const staffId = String(resolvedStaffId);

      const nestedUsername =
        r.username ??
        r.userName ??
        r.dealername ??
        r.staffUsername ??
        r.dealerStaffUsername ??
        r.dealerStaffName ??
        r.staffName ??
        r.dealerStaff?.username ??
        r.dealerStaff?.userName ??
        r.dealerStaff?.account?.username ??
        r.staff?.username ??
        r.staff?.userName ??
        r.staff?.account?.username ??
        r.userAccount?.username ??
        r.user?.username ??
        null;
      if (!byStaff.has(staffId)) {
        byStaff.set(staffId, {
          staffId,
          // Only use username provided by BE; do not fallback to "Staff <id>"
          staffName: nestedUsername || '',
          username: nestedUsername || '',
          totalOrders: 0,
          totalRevenue: 0,
          orders: [],
        });
      }
      const entry = byStaff.get(staffId);
      // If later records contain a username and the current label is a fallback, upgrade it
      if (nestedUsername && !entry.username) {
        entry.username = nestedUsername;
        entry.staffName = nestedUsername;
      }
      entry.totalOrders += 1;
      entry.totalRevenue += Number(r.saleAmount || 0);
      entry.orders.push({
        orderId: r.saleId,
        customer: '', // BE does not provide; leave blank
        date: r.saleDate,
        totalAmount: Number(r.saleAmount || 0),
      });
    }
    return { success: true, data: Array.from(byStaff.values()) };
  } catch (error) {
    const handled = handleAuthError(error);
    if (handled) return handled;
    console.error('Error fetching dealer sales records:', error);
    return { success: false, message: 'Failed to fetch dealer sales records' };
  }
}

export async function fetchActiveInstallmentDebts() {
  try {
    const token = localStorage.getItem('token');
    const url = withBase('/api/staff/viewCustomerWithActiveInstallments');
    const res = await axios.post(
      url,
      {},
      { headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': API_URL?.includes('ngrok') ? 'true' : undefined } }
    );
    const payload = res?.data;
    const list = payload?.data || [];
    // BE returns a map with keys from PaymentService: name, orderId, totalAmount, paidAmount, outstandingAmount, method, termMonth, monthlyPay, paymentDate, etc.
    // Normalize to the DebtReport UI fields.
    const normalized = list.map((it) => ({
      customerName: it.name || it.customerName || 'N/A',
      contractId: String(it.paymentId ?? it.orderId ?? ''),
      paymentType: (it.method === 'TT' ? 'Full Payment' : 'Installment'),
      installmentMonths: it.termMonth ?? null,
      totalAmount: Number(it.totalAmount || 0),
      paid: Number(it.paidAmount || 0),
      outstanding: Number(it.outstandingAmount || 0),
      dueDate: it.paymentDate || null, // next due date not provided; show paymentDate
      aging: it.status === 'Paid Off' ? 'Paid Off' : '< 30 days', // BE does not provide aging bucket; default minimal
      assignedStaff: '', // not provided
      installments: [], // not provided
    }));
    return { success: true, data: normalized };
  } catch (error) {
    const handled = handleAuthError(error);
    if (handled) return handled;
    console.error('Error fetching debts:', error);
    return { success: false, message: 'Failed to fetch debts' };
  }
}

// New: Debt summary per customer (PaymentService.getCustomerDebtSummaryByDealer)
// Controller mapping (per BE): @WebServlet("/api/staff/getCustomerDebt")
export async function fetchCustomerDebtSummary() {
  try {
    const token = localStorage.getItem('token');
    // API_URL already includes '/api', so don't prefix path with another '/api'
    const headers = { Authorization: `Bearer ${token}` };
    if (API_URL?.includes('ngrok')) headers['ngrok-skip-browser-warning'] = 'true';

    // Align with BE controller: /staff/getCustomerDebt
    // Some deployments expose doGet, others doPost → try GET then fallback to POST on 405
    const endpoint = `${API_URL}/staff/getCustomerDebt`;
    let res;
    try {
      res = await axios.get(endpoint, { headers });
    } catch (e) {
      const status = e?.response?.status;
      if (status === 405) {
        // fallback to POST
        res = await axios.post(endpoint, {}, { headers });
      } else {
        throw e;
      }
    }

    const payload = res?.data;
    const list = payload?.data || [];

    // Normalize both shapes:
    // A) Summary per customer (PaymentService.getCustomerDebtSummaryByDealer)
    //    Fields: name, email, phoneNumber, totalOutstandingDebt, totalPaidAmount, totalPlans
    // B) Detailed debt rows (older endpoints): customerName/name, contractId/paymentId/orderId, method, termMonth, totalAmount/paidAmount/outstandingAmount, paymentDate/nextDueDate
    const normalized = list.map((it, idx) => {
      const isSummaryShape =
        it?.totalOutstandingDebt !== undefined ||
        it?.totalPaidAmount !== undefined ||
        it?.totalPlans !== undefined;

      if (isSummaryShape) {
        const paid = Number(it.totalPaidAmount ?? 0);
        const outstanding = Number(it.totalOutstandingDebt ?? 0);
        const totalAmount = paid + outstanding;
        return {
          customerName: it.name || it.customerName || `Customer ${idx + 1}`,
          contractId: '—', // aggregated across multiple plans
          paymentType: 'Installment', // summary pertains to installment plans
          installmentMonths: null,
          totalAmount,
          paid,
          outstanding,
          dueDate: null,
          aging: outstanding > 0 ? '< 30 days' : 'Paid Off',
          assignedStaff: '', // not provided in summary
          installments: [],
        };
      }

      // Fallback to detailed mapping
      return {
        customerName: it.customerName || it.name || `Customer ${idx + 1}`,
        contractId: String(it.contractId ?? it.paymentId ?? it.orderId ?? ''),
        paymentType: it.method === 'TT' ? 'Full Payment' : 'Installment',
        installmentMonths: it.termMonth ?? it.remainingTerm ?? null,
        totalAmount: Number(it.totalAmount ?? it.principal ?? 0),
        paid: Number(it.paidAmount ?? it.paid ?? 0),
        outstanding: Number(it.outstandingAmount ?? it.remaining ?? 0),
        dueDate: it.nextDueDate || it.paymentDate || null,
        aging: it.aging || it.status || '< 30 days',
        assignedStaff: it.staffName || '',
        installments: it.installments || [],
      };
    });

    return { success: true, data: normalized };
  } catch (error) {
    const handled = handleAuthError(error);
    if (handled) return handled;
    console.error('Error fetching customer debt summary:', error);
    return { success: false, message: 'Failed to fetch debts' };
  }
}


