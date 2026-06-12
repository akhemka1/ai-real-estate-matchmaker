"""Off-plan payment-plan modelling — turns a price into a booking → construction
→ handover schedule based on the project's payment-plan split."""

from app.models.project import OffPlanProject
from app.schemas.project import PaymentInstallment, PaymentPlanResponse


def compute_payment_plan(
    project: OffPlanProject, price: float, installments: int
) -> PaymentPlanResponse:
    booking_amt = price * project.down_payment_pct / 100
    construction_amt = price * project.during_construction_pct / 100
    handover_amt = price * project.handover_pct / 100
    per = construction_amt / installments if installments > 0 else 0.0
    return PaymentPlanResponse(
        price=round(price, 2),
        currency=project.currency,
        booking=PaymentInstallment(
            label="Booking deposit", pct=project.down_payment_pct, amount=round(booking_amt, 2)
        ),
        during_construction=PaymentInstallment(
            label="During construction",
            pct=project.during_construction_pct,
            amount=round(construction_amt, 2),
        ),
        handover=PaymentInstallment(
            label="On handover", pct=project.handover_pct, amount=round(handover_amt, 2)
        ),
        per_installment=round(per, 2),
        installments=installments,
    )
