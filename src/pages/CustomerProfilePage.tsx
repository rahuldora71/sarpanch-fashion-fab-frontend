import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

import { getCustomerProfile, type CustomerProfileResponse } from "@/services/CustomerService";
import CustomerProfileHeader from "@/components/customers/profile/CustomerProfileHeader";
import CustomerProfileTabs, { type CustomerProfileTab } from "@/components/customers/profile/CustomerProfileTabs";
import CustomerOverview from "@/components/customers/profile/CustomerOverview";
import CustomerMeasurementsTab from "@/components/customers/profile/CustomerMeasurementsTab";
import CustomerOrdersTab from "@/components/customers/profile/CustomerOrdersTab";
import CustomerPaymentsTab from "@/components/customers/profile/CustomerPaymentsTab";
import CustomerAlterationsTab from "@/components/customers/profile/CustomerAlterationsTab";
import CustomerImageGallery from "@/components/customers/CustomerImageGallery";

const validTabs: CustomerProfileTab[] = [
  "overview",
  "photos",
  "measurements",
  "orders",
  "payments",
  "alterations",
];

export default function CustomerProfilePage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<CustomerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const activeTab = useMemo<CustomerProfileTab>(() => {
    const requested = searchParams.get("tab") as CustomerProfileTab | null;
    return requested && validTabs.includes(requested) ? requested : "overview";
  }, [searchParams]);

  useEffect(() => {
    const id = Number(customerId);
    if (!Number.isFinite(id)) {
      navigate("/customers", { replace: true });
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getCustomerProfile(id);
        if (!cancelled) setProfile(data);
      } catch (error) {
        console.error("Failed to load customer profile:", error);
        if (!cancelled) {
          toast.error("Failed to load customer profile.");
          navigate("/customers", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [customerId, navigate]);

  if (loading || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading customer profile…
        </div>
      </div>
    );
  }

  const customerIdNumber = profile.customer.id;

  return (
    <div className="mx-auto max-w-[1100px] space-y-0">
      <CustomerProfileHeader customer={profile.customer} />

      <CustomerProfileTabs customerId={customerIdNumber} activeTab={activeTab} />

      <div className="pt-5">
        {activeTab === "overview" ? (
          <CustomerOverview summary={profile.summary} orders={profile.orders} />
        ) : null}

        {activeTab === "photos" ? (
          <CustomerImageGallery
            customer={profile.customer}
            initialImages={profile.images}
            onCustomerUpdated={(updated) => {
              setProfile((prev) => (prev ? { ...prev, customer: updated } : prev));
            }}
          />
        ) : null}

        {activeTab === "measurements" ? (
          <CustomerMeasurementsTab
            measurements={profile.measurements}
            onNewMeasurement={() => navigate(`/measurements?customerId=${customerIdNumber}`)}
          />
        ) : null}

        {activeTab === "orders" ? <CustomerOrdersTab orders={profile.orders} /> : null}
        {activeTab === "payments" ? <CustomerPaymentsTab payments={profile.payments} /> : null}
        {activeTab === "alterations" ? (
          <CustomerAlterationsTab
            alterations={profile.alterations}
            customerId={customerIdNumber}
          />
        ) : null}
      </div>
    </div>
  );
}
