import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Package,
} from "lucide-react";

import toast from "react-hot-toast";

import {
    Button,
} from "@/components/ui/button";

import {
    Input,
} from "@/components/ui/input";

import {
    Card,
    CardContent,
} from "@/components/ui/card";

import {
    orderService,
} from "@/services/orderService";

import {
    GARMENT_STATUSES,
} from "@/types/order";

import type {
    GarmentStatus,
    OrderResponse,
    PageResponse,
} from "@/types/order";


// =========================================================
// CONSTANTS
// =========================================================

const PAGE_SIZE = 10;

const DEFAULT_SORT = "orderDate,desc";


// =========================================================
// STATUS LABEL
// =========================================================

const getStatusLabel = (
    status: string,
) => {
    return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase(),
        );
};


// =========================================================
// PAGE
// =========================================================

export default function OrdersPage() {

    const navigate =
        useNavigate();


    // =======================================================
    // DATA
    // =======================================================

    const [
        orders,
        setOrders,
    ] = useState<OrderResponse[]>([]);

    const [
        pageData,
        setPageData,
    ] = useState<
        PageResponse<OrderResponse> | null
    >(null);


    // =======================================================
    // FILTERS
    // =======================================================

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        status,
        setStatus,
    ] = useState<GarmentStatus | "ALL">(
        "ALL",
    );

    const [
        page,
        setPage,
    ] = useState(0);


    // =======================================================
    // UI
    // =======================================================

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);


    // =======================================================
    // LOAD ORDERS
    // =======================================================

    const loadOrders =
        useCallback(
            async () => {

                try {

                    setLoading(true);


                    let response:
                        PageResponse<OrderResponse>;


                    /*
                     * -------------------------------------------------
                     * STATUS FILTER
                     * -------------------------------------------------
                     */

                    if (
                        status !== "ALL"
                    ) {

                        response =
                            await orderService
                                .getOrdersByStatus(
                                    status,
                                    {
                                        page,
                                        size: PAGE_SIZE,
                                        sort: DEFAULT_SORT,
                                    },
                                );

                    }

                    /*
                     * -------------------------------------------------
                     * SEARCH
                     * -------------------------------------------------
                     */

                    else if (
                        search.trim()
                    ) {

                        response =
                            await orderService
                                .searchOrders(
                                    search.trim(),
                                    {
                                        page,
                                        size: PAGE_SIZE,
                                        sort: DEFAULT_SORT,
                                    },
                                );

                    }

                    /*
                     * -------------------------------------------------
                     * ALL ORDERS
                     * -------------------------------------------------
                     */

                    else {

                        response =
                            await orderService
                                .getAllOrders(
                                    {
                                        page,
                                        size: PAGE_SIZE,
                                        sort: DEFAULT_SORT,
                                    },
                                );

                    }


                    setOrders(
                        response?.content ?? [],
                    );

                    setPageData(
                        response,
                    );

                } catch (error) {

                    console.error(
                        "Failed to load orders:",
                        error,
                    );

                    setOrders([]);

                    setPageData(null);

                    toast.error(
                        "Failed to load orders.",
                    );

                } finally {

                    setLoading(false);

                    setRefreshing(false);

                }

            },
            [
                page,
                search,
                status,
            ],
        );


    // =======================================================
    // INITIAL LOAD / SEARCH
    // =======================================================

    useEffect(() => {

        const timeout =
            window.setTimeout(
                () => {
                    void loadOrders();
                },
                search.trim()
                    ? 350
                    : 0,
            );


        return () => {
            window.clearTimeout(timeout);
        };

    }, [
        loadOrders,
    ]);


    // =======================================================
    // SEARCH
    // =======================================================

    const handleSearchChange =
        (
            value: string,
        ) => {

            setSearch(value);

            /*
             * Search and status are
             * separate backend endpoints.
             *
             * When searching, reset
             * the status filter.
             */

            if (
                value.trim() &&
                status !== "ALL"
            ) {
                setStatus("ALL");
            }


            if (
                page !== 0
            ) {
                setPage(0);
            }
        };


    // =======================================================
    // STATUS CHANGE
    // =======================================================

    const handleStatusChange =
        (
            value: string,
        ) => {

            const nextStatus =
                value as
                    | GarmentStatus
                    | "ALL";


            setStatus(
                nextStatus,
            );

            /*
             * Status filtering and
             * search are separate
             * backend endpoints.
             */

            if (
                nextStatus !== "ALL" &&
                search
            ) {
                setSearch("");
            }


            setPage(0);
        };


    // =======================================================
    // REFRESH
    // =======================================================

    const handleRefresh =
        () => {

            setRefreshing(true);

            void loadOrders();

        };


    // =======================================================
    // PAGINATION
    // =======================================================

    const handlePrevious =
        () => {

            if (
                pageData?.first
            ) {
                return;
            }

            setPage(
                (previous) =>
                    Math.max(
                        previous - 1,
                        0,
                    ),
            );
        };


    const handleNext =
        () => {

            if (
                pageData?.last
            ) {
                return;
            }

            setPage(
                (previous) =>
                    previous + 1,
            );
        };


    // =======================================================
    // VIEW ORDER
    // =======================================================

    const handleViewOrder =
        (
            orderId: number,
        ) => {

            /*
             * Order details page can be
             * added later.
             *
             * Keep this ready.
             */

            navigate(
                `/orders/${orderId}`,
            );
        };


    // =======================================================
    // CREATE ORDER
    // =======================================================

    const handleCreateOrder =
        () => {

            navigate(
                "/orders/new",
            );
        };


    // =======================================================
    // RESULT RANGE
    // =======================================================

    const start =
        pageData &&
        pageData.numberOfElements > 0
            ? pageData.number *
                    pageData.size +
                1
            : 0;


    const end =
        pageData &&
        pageData.numberOfElements > 0
            ? pageData.number *
                    pageData.size +
                pageData.numberOfElements
            : 0;


    // =======================================================
    // RENDER
    // =======================================================

    return (
        <main className="min-h-full bg-background text-foreground">

            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-7">


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                        <h1 className="text-2xl font-semibold tracking-tight">
                            Orders
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage customer orders and garment production.
                        </p>

                    </div>


                    <Button
                        type="button"
                        onClick={
                            handleCreateOrder
                        }
                    >
                        <Plus className="mr-2 h-4 w-4" />

                        New Order
                    </Button>

                </div>


                {/* =================================================
                    FILTERS
                ================================================= */}

                <Card className="mt-6">

                    <CardContent className="p-4">

                        <div className="flex flex-col gap-3 md:flex-row">

                            {/* SEARCH */}

                            <div className="relative flex-1">

                                <Search
                                    className="
                                        pointer-events-none
                                        absolute
                                        left-3
                                        top-1/2
                                        h-4
                                        w-4
                                        -translate-y-1/2
                                        text-muted-foreground
                                    "
                                />

                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        handleSearchChange(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Search orders..."
                                    className="pl-9"
                                />

                            </div>


                            {/* STATUS */}

                            <select
                                value={status}
                                onChange={(event) =>
                                    handleStatusChange(
                                        event.target.value,
                                    )
                                }
                                className="
                                    h-10
                                    w-full
                                    rounded-md
                                    border
                                    border-input
                                    bg-background
                                    px-3
                                    text-sm
                                    outline-none
                                    focus:ring-2
                                    focus:ring-ring
                                    md:w-56
                                "
                            >

                                <option value="ALL">
                                    All Garment Statuses
                                </option>

                                {GARMENT_STATUSES.map(
                                    (item) => (
                                        <option
                                            key={item}
                                            value={item}
                                        >
                                            {getStatusLabel(
                                                item,
                                            )}
                                        </option>
                                    ),
                                )}

                            </select>


                            {/* REFRESH */}

                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={
                                    handleRefresh
                                }
                                disabled={
                                    refreshing
                                }
                                title="Refresh orders"
                            >

                                <RefreshCw
                                    className={
                                        `
                                        h-4
                                        w-4
                                        ${
                                            refreshing
                                                ? "animate-spin"
                                                : ""
                                        }
                                        `
                                    }
                                />

                            </Button>

                        </div>


                        {/* FILTER INFO */}

                        {status !== "ALL" && (
                            <p className="mt-3 text-xs text-muted-foreground">

                                Showing orders containing garments with status{" "}

                                <span className="font-medium text-foreground">
                                    {getStatusLabel(
                                        status,
                                    )}
                                </span>

                            </p>
                        )}

                    </CardContent>

                </Card>


                {/* =================================================
                    ORDER LIST
                ================================================= */}

                <Card className="mt-4 overflow-hidden">

                    {/* LOADING */}

                    {loading ? (

                        <div className="flex min-h-[300px] items-center justify-center">

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">

                                <RefreshCw className="h-4 w-4 animate-spin" />

                                Loading orders...

                            </div>

                        </div>

                    ) : orders.length === 0 ? (

                        /* EMPTY */

                        <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">

                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">

                                <Package className="h-6 w-6 text-muted-foreground" />

                            </div>

                            <h2 className="mt-4 text-base font-semibold">
                                No orders found
                            </h2>

                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">

                                {search.trim()
                                    ? "Try a different search term."
                                    : status !== "ALL"
                                        ? "There are no orders matching this garment status."
                                        : "Create your first order to get started."}

                            </p>


                            {!search.trim() &&
                                status === "ALL" && (
                                    <Button
                                        type="button"
                                        className="mt-5"
                                        onClick={
                                            handleCreateOrder
                                        }
                                    >
                                        <Plus className="mr-2 h-4 w-4" />

                                        Create Order
                                    </Button>
                                )}

                        </div>

                    ) : (

                        /* =================================================
                           DESKTOP TABLE
                        ================================================= */

                        <>

                            <div className="hidden overflow-x-auto md:block">

                                <table className="w-full">

                                    <thead className="border-b bg-muted/30">

                                        <tr>

                                            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Order
                                            </th>

                                            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Customer
                                            </th>

                                            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Order Date
                                            </th>

                                            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Sample Page
                                            </th>

                                            <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                Action
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {orders.map(
                                            (order) => (
                                                <tr
                                                    key={
                                                        order.id
                                                    }
                                                    className="
                                                        border-b
                                                        last:border-0
                                                        hover:bg-muted/20
                                                    "
                                                >

                                                    <td className="px-5 py-4">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleViewOrder(
                                                                    order.id,
                                                                )
                                                            }
                                                            className="
                                                                text-left
                                                                text-sm
                                                                font-medium
                                                                hover:underline
                                                            "
                                                        >
                                                            #
                                                            {order.id}
                                                        </button>

                                                    </td>


                                                    <td className="px-5 py-4">

                                                        <div>

                                                            <p className="text-sm font-medium">
                                                                {
                                                                    order.customerName
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                                                {
                                                                    order.customerCode
                                                                }
                                                            </p>

                                                        </div>

                                                    </td>


                                                    <td className="px-5 py-4 text-sm text-muted-foreground">

                                                        {order.orderDate}

                                                    </td>


                                                    <td className="px-5 py-4 text-sm text-muted-foreground">

                                                        {order.sampleBookPageNumber ||
                                                            "—"}

                                                    </td>


                                                    <td className="px-5 py-4 text-right">

                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleViewOrder(
                                                                    order.id,
                                                                )
                                                            }
                                                        >
                                                            View
                                                        </Button>

                                                    </td>

                                                </tr>
                                            ),
                                        )}

                                    </tbody>

                                </table>

                            </div>


                            {/* =================================================
                                MOBILE LIST
                            ================================================= */}

                            <div className="divide-y md:hidden">

                                {orders.map(
                                    (order) => (
                                        <button
                                            key={
                                                order.id
                                            }
                                            type="button"
                                            onClick={() =>
                                                handleViewOrder(
                                                    order.id,
                                                )
                                            }
                                            className="
                                                flex
                                                w-full
                                                items-center
                                                justify-between
                                                gap-4
                                                px-4
                                                py-4
                                                text-left
                                                transition-colors
                                                hover:bg-muted/30
                                            "
                                        >

                                            <div className="min-w-0">

                                                <div className="flex items-center gap-2">

                                                    <p className="truncate text-sm font-medium">

                                                        Order #
                                                        {order.id}

                                                    </p>

                                                </div>


                                                <p className="mt-1 truncate text-sm">

                                                    {
                                                        order.customerName
                                                    }

                                                </p>


                                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">

                                                    <span>
                                                        {
                                                            order.customerCode
                                                        }
                                                    </span>

                                                    <span>
                                                        {
                                                            order.orderDate
                                                        }
                                                    </span>

                                                </div>

                                            </div>


                                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />

                                        </button>
                                    ),
                                )}

                            </div>

                        </>

                    )}


                    {/* =================================================
                        PAGINATION
                    ================================================= */}

                    {!loading &&
                        pageData &&
                        pageData.totalPages > 0 && (
                            <div className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">

                                <p className="text-center text-xs text-muted-foreground sm:text-left">

                                    Showing{" "}

                                    <span className="font-medium text-foreground">
                                        {start}
                                    </span>

                                    {" "}to{" "}

                                    <span className="font-medium text-foreground">
                                        {end}
                                    </span>

                                    {" "}of{" "}

                                    <span className="font-medium text-foreground">
                                        {
                                            pageData.totalElements
                                        }
                                    </span>

                                    {" "}orders

                                </p>


                                <div className="flex items-center justify-center gap-2">

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        disabled={
                                            pageData.first
                                        }
                                        onClick={
                                            handlePrevious
                                        }
                                    >

                                        <ChevronLeft className="h-4 w-4" />

                                    </Button>


                                    <span className="min-w-20 text-center text-xs text-muted-foreground">

                                        Page{" "}

                                        <span className="font-medium text-foreground">
                                            {
                                                pageData.number +
                                                1
                                            }
                                        </span>

                                        {" "}of{" "}

                                        <span className="font-medium text-foreground">
                                            {
                                                pageData.totalPages
                                            }
                                        </span>

                                    </span>


                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        disabled={
                                            pageData.last
                                        }
                                        onClick={
                                            handleNext
                                        }
                                    >

                                        <ChevronRight className="h-4 w-4" />

                                    </Button>

                                </div>

                            </div>
                        )}

                </Card>

            </div>

        </main>
    );
}
