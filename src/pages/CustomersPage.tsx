import { useEffect, useState } from "react";

import {
    ChevronLeft, ChevronRight, Eye, Loader2, Plus, Search, UserRound, Users,
} from "lucide-react";
import CustomerAvatar from "@/components/customers/CustomerAvatar";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import {
    getCustomers,
    searchCustomers,
    type CustomerPageResponse,
    type CustomerSummary,
} from "@/services/CustomerService";

import { Button } from "@/components/ui/button";

import {
    Card,
    CardContent,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { APP_CONFIG } from "@/config/appConfig";


// =========================================================
// CONSTANTS
// =========================================================

const PAGE_SIZE = APP_CONFIG.customers.pageSize;
const DEFAULT_SORT = "createdAt,desc";


// =========================================================
// CUSTOMERS PAGE
// =========================================================

export default function CustomersPage() {

    const navigate = useNavigate();


    // =======================================================
    // STATE
    // =======================================================

    const [customers, setCustomers] =
        useState<CustomerSummary[]>([]);

    const [pageData, setPageData] =
        useState<CustomerPageResponse | null>(null);

    const [page, setPage] =
        useState(0);

    const [search, setSearch] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [searching, setSearching] =
        useState(false);


    // =======================================================
    // LOAD CUSTOMERS
    //
    // Handles both:
    //
    // GET /customers
    //
    // and
    //
    // GET /customers/search
    // =======================================================

    const loadCustomers = async (
        pageNumber: number,
        keyword: string = ""
    ) => {

        const trimmedKeyword =
            keyword.trim();

        try {


            // -----------------------------------------------
            // Loading state
            // -----------------------------------------------

            if (trimmedKeyword) {

                setSearching(true);

            } else {

                setLoading(true);

            }


            // -----------------------------------------------
            // API request
            // -----------------------------------------------

            const data =
                trimmedKeyword
                    ? await searchCustomers(
                        trimmedKeyword,
                        pageNumber,
                        PAGE_SIZE,
                        DEFAULT_SORT
                    )
                    : await getCustomers(
                        pageNumber,
                        PAGE_SIZE,
                        DEFAULT_SORT
                    );


            console.log(
                "CUSTOMER PAGE RESPONSE:",
                data
            );


            // -----------------------------------------------
            // Customers
            // -----------------------------------------------
            const customerList = data.content || [];

            setCustomers(customerList);


            // -----------------------------------------------
            // Pagination information
            // -----------------------------------------------

            setPageData(
                data
            );

        } catch (error) {

            console.error(
                "Failed to load customers:",
                error
            );


            setCustomers([]);


            toast.error(
                trimmedKeyword
                    ? "Unable to search customers."
                    : "Failed to load customers."
            );

        } finally {

            setLoading(false);

            setSearching(false);

        }

    };


    // =======================================================
    // LOAD DATA
    //
    // One effect only.
    //
    // page OR search changes
    //        ↓
    // loadCustomers()
    // =======================================================

    useEffect(() => {

        const keyword =
            search.trim();


        const timeout =
            setTimeout(
                () => {

                    loadCustomers(
                        page,
                        keyword
                    );

                },
                keyword ? 400 : 0
            );


        return () => {

            clearTimeout(
                timeout
            );

        };

    }, [page, search]);


    // =======================================================
    // PAGE CHANGE
    // =======================================================

    const handlePageChange = (
        newPage: number
    ) => {

        // Cannot go below page 0

        if (newPage < 0) {
            return;
        }


        // Cannot go beyond last page

        if (
            pageData &&
            newPage >= pageData.totalPages
        ) {
            return;
        }


        setPage(
            newPage
        );

    };


    // =======================================================
    // SEARCH CHANGE
    // =======================================================

    const handleSearchChange = (
        value: string
    ) => {

        setSearch(
            value
        );


        // New search should always
        // start from first page.

        if (page !== 0) {

            setPage(0);

        }

    };


    // =======================================================
    // VIEW CUSTOMER
    // =======================================================

    const handleViewCustomer = (
        customerId: number
    ) => {

        navigate(
            `/customers/${customerId}`
        );

    };


    // =======================================================
    // ADD CUSTOMER
    // =======================================================

    const handleAddCustomer = () => {

        navigate(
            "/customers/new"
        );

    };


    


    // =======================================================
    // PAGE NUMBERS
    // =======================================================

    const getPageNumbers = () => {

        if (!pageData) {
            return [];
        }


        const totalPages =
            pageData.totalPages;


        const currentPage =
            page;


        // -----------------------------------------------
        // Five or fewer pages
        // -----------------------------------------------

        if (totalPages <= 5) {

            return Array.from(
                {
                    length: totalPages,
                },
                (_, index) => index
            );

        }


        // -----------------------------------------------
        // Beginning
        // -----------------------------------------------

        if (currentPage <= 2) {

            return [
                0,
                1,
                2,
                3,
                4,
            ];

        }


        // -----------------------------------------------
        // End
        // -----------------------------------------------

        if (
            currentPage >=
            totalPages - 3
        ) {

            return [
                totalPages - 5,
                totalPages - 4,
                totalPages - 3,
                totalPages - 2,
                totalPages - 1,
            ];

        }


        // -----------------------------------------------
        // Middle
        // -----------------------------------------------

        return [
            currentPage - 2,
            currentPage - 1,
            currentPage,
            currentPage + 1,
            currentPage + 2,
        ];

    };


    // =======================================================
    // RENDER
    // =======================================================

    return (

        <div className="space-y-6">


            {/* =================================================
          HEADER
      ================================================== */}

            <div
                className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
            >

                <div>

                    <h1
                        className="
              text-2xl
              font-bold
              tracking-tight
              sm:text-3xl
            "
                    >
                        Customers
                    </h1>


                    <p
                        className="
              mt-1
              text-sm
              text-muted-foreground
            "
                    >
                        Manage your customers and their information.
                    </p>

                </div>


                <Button
                    onClick={
                        handleAddCustomer
                    }
                    className="
            w-full
            sm:w-auto
          "
                >

                    <Plus className="mr-2 size-4" />

                    Add Customer

                </Button>

            </div>


            {/* =================================================
          TOTAL CUSTOMERS
      ================================================== */}

            <Card>

                <CardContent
                    className="
            flex
            items-center
            gap-4
            p-5
          "
                >

                    <div
                        className="
              flex
              size-11
              items-center
              justify-center
              rounded-lg
              bg-primary/10
              text-primary
            "
                    >

                        <Users className="size-5" />

                    </div>


                    <div>

                        <p
                            className="
                text-sm
                text-muted-foreground
              "
                        >
                            Total Customers
                        </p>


                        <p className="text-2xl font-bold">

                            {customers.length}
                        </p>

                    </div>

                </CardContent>

            </Card>


            {/* =================================================
          SEARCH
      ================================================== */}

            <Card>

                <CardContent className="p-4">

                    <div className="relative">

                        <Search
                            className="
                absolute
                left-3
                top-1/2
                size-4
                -translate-y-1/2
                text-muted-foreground
              "
                        />


                        <Input
                            value={search}
                            onChange={(event) =>
                                handleSearchChange(
                                    event.target.value
                                )
                            }
                            placeholder="
                Search by name, phone, email or customer code...
              "
                            className="
                pl-9
                pr-10
              "
                        />


                        {(loading || searching) && (

                            <Loader2
                                className="
                  absolute
                  right-3
                  top-1/2
                  size-4
                  -translate-y-1/2
                  animate-spin
                  text-muted-foreground
                "
                            />

                        )}

                    </div>

                </CardContent>

            </Card>


            {/* =================================================
          CUSTOMER LIST
      ================================================== */}

            <Card className="overflow-hidden">


                {/* =================================================
            DESKTOP / TABLET
        ================================================== */}

                <div className="hidden md:block">


                    {/* Table Header */}

                    <div
                        className="
              grid
              grid-cols-[1.5fr_1.2fr_1.2fr_1.5fr_auto]
              items-center
              gap-4
              border-b
              bg-muted/40
              px-5
              py-3
              text-xs
              font-medium
              uppercase
              tracking-wide
              text-muted-foreground
            "
                    >

                        <div>
                            Customer
                        </div>

                        <div>
                            Customer Code
                        </div>

                        <div>
                            Phone
                        </div>

                        <div>
                            Email
                        </div>

                        <div>
                            Action
                        </div>

                    </div>


                    {/* Loading */}

                    {loading ? (

                        <LoadingState />

                    ) : customers.length === 0 ? (

                        <EmptyState
                            search={search}
                            onAddCustomer={
                                handleAddCustomer
                            }
                        />

                    ) : (

                        <div>

                            {customers.map(
                                (customer) => (

                                    <div
                                        key={customer.id}
                                        className="
                      grid
                      grid-cols-[1.5fr_1.2fr_1.2fr_1.5fr_auto]
                      items-center
                      gap-4
                      border-b
                      px-5
                      py-4
                      last:border-b-0
                      transition-colors
                      hover:bg-muted/30
                    "
                                    >


                                        {/* Customer */}

                                        <div
                                            className="
                        flex
                        min-w-0
                        items-center
                        gap-3
                      "
                                        >


                                            <CustomerAvatar
                                                customer={customer}
                                                size="sm"
                                            />


                                            <div className="min-w-0">

                                                <p
                                                    className="
                            truncate
                            font-medium
                          "
                                                >
                                                    {customer.name}
                                                </p>


                                                <p
                                                    className="
                            text-xs
                            text-muted-foreground
                          "
                                                >
                                                    ID: {customer.id}
                                                </p>

                                            </div>

                                        </div>


                                        {/* Customer Code */}

                                        <div
                                            className="
                        font-mono
                        text-sm
                      "
                                        >
                                            {customer.customerCode}
                                        </div>


                                        {/* Phone */}

                                        <div className="text-sm">

                                            {customer.phone}

                                        </div>


                                        {/* Email */}

                                        <div
                                            className="
                        truncate
                        text-sm
                        text-muted-foreground
                      "
                                        >

                                            {customer.email || "—"}

                                        </div>


                                        {/* Action */}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                handleViewCustomer(
                                                    customer.id
                                                )
                                            }
                                        >

                                            <Eye className="size-4" />

                                            <span className="sr-only">
                                                View customer
                                            </span>

                                        </Button>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </div>


                {/* =================================================
            MOBILE
        ================================================== */}

                <div className="md:hidden">

                    {loading ? (

                        <LoadingState />

                    ) : customers.length === 0 ? (

                        <EmptyState
                            search={search}
                            onAddCustomer={
                                handleAddCustomer
                            }
                        />

                    ) : (

                        <div>

                            {customers.map(
                                (customer) => (

                                    <button
                                        key={customer.id}
                                        type="button"
                                        onClick={() =>
                                            handleViewCustomer(
                                                customer.id
                                            )
                                        }
                                        className="
                      flex
                      w-full
                      items-center
                      gap-3
                      border-b
                      p-4
                      text-left
                      last:border-b-0
                      hover:bg-muted/30
                    "
                                    >

                                        <CustomerAvatar
                                            customer={customer}
                                            size="md"
                                        />


                                        <div
                                            className="
                        min-w-0
                        flex-1
                      "
                                        >

                                            <div
                                                className="
                          flex
                          items-center
                          justify-between
                          gap-2
                        "
                                            >

                                                <p
                                                    className="
                            truncate
                            font-semibold
                          "
                                                >
                                                    {customer.name}
                                                </p>


                                                <Eye
                                                    className="
                            size-4
                            shrink-0
                            text-muted-foreground
                          "
                                                />

                                            </div>


                                            <p
                                                className="
                          mt-1
                          font-mono
                          text-xs
                          text-muted-foreground
                        "
                                            >
                                                {customer.customerCode}
                                            </p>


                                            <div
                                                className="
                          mt-1
                          flex
                          flex-col
                          gap-0.5
                          text-xs
                          text-muted-foreground
                          sm:flex-row
                          sm:gap-3
                        "
                                            >

                                                <span>
                                                    {customer.phone}
                                                </span>


                                                {customer.email && (

                                                    <span className="truncate">

                                                        {customer.email}

                                                    </span>

                                                )}

                                            </div>

                                        </div>

                                    </button>

                                )
                            )}

                        </div>

                    )}

                </div>


                {/* =================================================
            PAGINATION
        ================================================== */}

                {!loading &&
                    pageData &&
                    pageData.totalPages > 0 && (

                        <div
                            className="
                flex
                flex-col
                gap-4
                border-t
                bg-muted/20
                px-4
                py-4
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
                        >


                            {/* Result information */}

                            <p
                                className="
                  text-center
                  text-xs
                  text-muted-foreground
                  sm:text-left
                "
                            >

                                Showing{" "}

                                <span
                                    className="
                    font-medium
                    text-foreground
                  "
                                >

                                    {pageData.number *
                                        pageData.size +
                                        1}

                                </span>


                                {" "}to{" "}


                                <span
                                    className="
                    font-medium
                    text-foreground
                  "
                                >

                                    {pageData.number *
                                        pageData.size +
                                        pageData.numberOfElements}

                                </span>


                                {" "}of{" "}


                                <span
                                    className="
                    font-medium
                    text-foreground
                  "
                                >

                                    {pageData.totalElements}

                                </span>


                                {" "}customers

                            </p>


                            {/* Pagination controls */}

                            <div
                                className="
                  flex
                  items-center
                  justify-center
                  gap-1
                "
                            >


                                {/* Previous */}

                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={
                                        pageData.first
                                    }
                                    onClick={() =>
                                        handlePageChange(
                                            page - 1
                                        )
                                    }
                                >

                                    <ChevronLeft className="size-4" />

                                    <span className="sr-only">
                                        Previous page
                                    </span>

                                </Button>


                                {/* Desktop page numbers */}

                                <div
                                    className="
                    hidden
                    items-center
                    gap-1
                    sm:flex
                  "
                                >

                                    {getPageNumbers().map(
                                        (pageNumber) => (

                                            <Button
                                                key={
                                                    pageNumber
                                                }
                                                variant={
                                                    pageNumber === page
                                                        ? "default"
                                                        : "outline"
                                                }
                                                size="icon"
                                                onClick={() =>
                                                    handlePageChange(
                                                        pageNumber
                                                    )
                                                }
                                            >

                                                {pageNumber + 1}

                                            </Button>

                                        )
                                    )}

                                </div>


                                {/* Mobile page indicator */}

                                <div
                                    className="
                    flex
                    min-w-16
                    items-center
                    justify-center
                    text-sm
                    font-medium
                    sm:hidden
                  "
                                >

                                    {page + 1}

                                    {" / "}

                                    {pageData.totalPages}

                                </div>


                                {/* Next */}

                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={
                                        pageData.last
                                    }
                                    onClick={() =>
                                        handlePageChange(
                                            page + 1
                                        )
                                    }
                                >

                                    <ChevronRight className="size-4" />

                                    <span className="sr-only">
                                        Next page
                                    </span>

                                </Button>

                            </div>

                        </div>

                    )}

            </Card>

        </div>

    );

}


// =========================================================
// LOADING STATE
// =========================================================

function LoadingState() {

    return (

        <div
            className="
        flex
        min-h-52
        items-center
        justify-center
      "
        >

            <Loader2
                className="
          size-6
          animate-spin
          text-muted-foreground
        "
            />

        </div>

    );

}


// =========================================================
// EMPTY STATE
// =========================================================

interface EmptyStateProps {

    search: string;

    onAddCustomer: () => void;

}


function EmptyState({
    search,
    onAddCustomer,
}: EmptyStateProps) {

    return (

        <div
            className="
        flex
        min-h-64
        flex-col
        items-center
        justify-center
        px-6
        text-center
      "
        >

            <div
                className="
          mb-4
          flex
          size-12
          items-center
          justify-center
          rounded-full
          bg-muted
        "
            >

                <UserRound
                    className="
            size-6
            text-muted-foreground
          "
                />

            </div>


            <h3 className="font-semibold">

                {search
                    ? "No customers found"
                    : "No customers yet"}

            </h3>


            <p
                className="
          mt-1
          max-w-sm
          text-sm
          text-muted-foreground
        "
            >

                {search
                    ? "Try searching with a different name, phone number or customer code."
                    : "Start by adding your first customer."}

            </p>


            {!search && (

                <Button
                    className="mt-5"
                    onClick={
                        onAddCustomer
                    }
                >

                    <Plus className="mr-2 size-4" />

                    Add Customer

                </Button>

            )}

        </div>

    );

}