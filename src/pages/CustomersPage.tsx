import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  getCustomers,
  searchCustomers,
  type CustomerPageResponse,
  type CustomerSummary,
} from "@/services/CustomerService";
import { APP_CONFIG } from "@/config/appConfig";

import CustomerPageHeader from "@/components/customers/CustomerPageHeader";
import CustomerToolbar, { type CustomerFilter } from "@/components/customers/CustomerToolbar";
import CustomerTableHeader from "@/components/customers/CustomerTableHeader";
import CustomerTableRow from "@/components/customers/CustomerTableRow";
import CustomerMobileCard from "@/components/customers/CustomerMobileCard";
import CustomerLoadingState from "@/components/customers/CustomerLoadingState";
import CustomerEmptyState from "@/components/customers/CustomerEmptyState";
import CustomerPagination from "@/components/customers/CustomerPagination";
import { Card } from "@/components/ui/card";

const PAGE_SIZE = APP_CONFIG.customers.pageSize;
const DEFAULT_SORT = "createdAt,desc";

export default function CustomersPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [pageData, setPageData] = useState<CustomerPageResponse | null>(null);
  const [page, setPage] = useState(0);

  // Decoupled search states:
  // `searchInput` is what the user is typing (powers Google-style suggestions)
  // `appliedSearch` is what has been submitted via "Search" button or Enter (powers main table)
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const loadCustomers = async (pageNumber: number, keyword: string) => {
    const trimmed = keyword.trim();

    try {
      if (trimmed) setSearching(true);
      else setLoading(true);

      const data = trimmed
        ? await searchCustomers(trimmed, pageNumber, PAGE_SIZE, DEFAULT_SORT)
        : await getCustomers(pageNumber, PAGE_SIZE, DEFAULT_SORT);

      setPageData(data);
      setCustomers(data.content ?? []);
    } catch (error) {
      console.error("Failed to load customers:", error);
      setCustomers([]);
      setPageData(null);
      toast.error(trimmed ? "Unable to search customers." : "Failed to load customers.");
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  // Table re-queries ONLY when page or appliedSearch changes!
  // Typing in searchInput will NEVER trigger loadCustomers for the table.
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCustomers(page, appliedSearch);
    }, 0);
    return () => clearTimeout(timer);
  }, [page, appliedSearch]);

  const filteredCustomers =
    filter === "all"
      ? customers
      : customers.filter((customer) => (customer.balance ?? 0) > 0);

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
  };

  const handleApplySearch = (query: string) => {
    setAppliedSearch(query.trim());
    setPage(0);
  };

  const handleResetSearch = () => {
    setSearchInput("");
    setAppliedSearch("");
    setPage(0);
  };

  const handleFilterChange = (value: CustomerFilter) => {
    setFilter(value);
    setPage(0);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 0) return;
    if (pageData && newPage >= pageData.totalPages) return;
    setPage(newPage);
  };

  return (
    <div className="space-y-4">
      <CustomerPageHeader
        totalCustomers={pageData?.totalElements ?? 0}
        onAddCustomer={() => navigate("/customers/new")}
      />

      <CustomerToolbar
        searchInput={searchInput}
        appliedSearch={appliedSearch}
        filter={filter}
        searching={searching}
        onSearchInputChange={handleSearchInputChange}
        onApplySearch={handleApplySearch}
        onResetSearch={handleResetSearch}
        onFilterChange={handleFilterChange}
      />

      <Card className="overflow-hidden rounded-2xl border-border/80 bg-card shadow-xs">
        {loading ? (
          <CustomerLoadingState />
        ) : filteredCustomers.length === 0 ? (
          <CustomerEmptyState
            search={appliedSearch}
            onAddCustomer={() => navigate("/customers/new")}
          />
        ) : (
          <>
            <div className="hidden xl:block">
              <CustomerTableHeader />
              {filteredCustomers.map((customer) => (
                <CustomerTableRow
                  key={customer.id}
                  customer={customer}
                  onView={(id) => navigate(`/customers/${id}`)}
                  onCreateOrder={(id) => navigate(`/orders/new?customerId=${id}`)}
                />
              ))}
            </div>

            <div className="xl:hidden">
              {filteredCustomers.map((customer) => (
                <CustomerMobileCard
                  key={customer.id}
                  customer={customer}
                  onView={(id) => navigate(`/customers/${id}`)}
                  onCreateOrder={(id) => navigate(`/orders/new?customerId=${id}`)}
                />
              ))}
            </div>
          </>
        )}

        {!loading && pageData && pageData.totalPages > 0 ? (
          <CustomerPagination pageData={pageData} page={page} onPageChange={handlePageChange} />
        ) : null}
      </Card>
    </div>
  );
}
