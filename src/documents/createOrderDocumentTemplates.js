import logoPic from "../../public/logo-2.png";
import logoCAS from "../../public/cas-logo.png";
import logoMFD from "../../public/mfd-logo.png";

export function createOrderDocumentTemplates(filterPlaces) {
  const getPlaceName = (placeId) => {
    if (!placeId) return "-";
    const place = filterPlaces.find((p) => p.value === placeId.toString());
    return place ? place.label : placeId;
  };

  const getReceiverAddress = (orderData) =>
    orderData?.receivers?.[0]?.receiveraddress || null;
  const getReceiverName = (orderData) =>
    orderData?.receivers?.[0]?.receiverName || null;
  const getReceiverEmail = (orderData) =>
    orderData?.receivers?.[0]?.receiveremail || null;

  // ↓↓↓ Cut these verbatim from OrdersList.jsx and paste here, unmodified ↓↓↓
  // extractContainers, getContainerData, generateOrderRows, getContainerCategory,
  // generateContainerPage, PartyShipperUndertakingForANF,
  // PartyShipperIndemnityForEachOrderFormat, CASBillofLading,
  // DubaiLetterOfIndemnityForCustoms, KarachiGovtCustomsStampPaperUndertakingFormat,
  // KarachiUndertakingForCustomsEachSenderShouldGive,
  // ReceiverUndertakingForDubaiCustoms, ReceiverUndertakingDubaiANF,
  // SenderUndertakingForThirdPartyShipper, WHARFAGEConsignmentsNote,
  // OrderAcknowledgementPrintableVersion,
  // OrderConfirmationAndAcceptanceDubaiReceiver,
  // OrderConfirmationAndAcceptanceKarachiReceiver,
  // OrderConfirmationAndAcceptanceUKReceiver, MessiahBillofLading,
  // RGSLBillofLading, KYCDubaiCompany, KYCUKCompany, KYCKarachiCompany
  // ↑↑↑ every reference to getPlaceName/getReceiverAddress/getReceiverName/
  //     getReceiverEmail/logoPic/logoCAS/logoMFD inside them stays valid,
  //     because they're now in the same closure. ↑↑↑

  return {
    PartyShipperUndertakingForANF,
    PartyShipperIndemnityForEachOrderFormat,
    CASBillofLading,
    DubaiLetterOfIndemnityForCustoms,
    KarachiGovtCustomsStampPaperUndertakingFormat,
    KarachiUndertakingForCustomsEachSenderShouldGive,
    ReceiverUndertakingForDubaiCustoms,
    ReceiverUndertakingDubaiANF,
    SenderUndertakingForThirdPartyShipper,
    WHARFAGEConsignmentsNote,
    OrderAcknowledgementPrintableVersion,
    OrderConfirmationAndAcceptanceDubaiReceiver,
    OrderConfirmationAndAcceptanceKarachiReceiver,
    OrderConfirmationAndAcceptanceUKReceiver,
    MessiahBillofLading,
    RGSLBillofLading,
    KYCDubaiCompany,
    KYCUKCompany,
    KYCKarachiCompany,
  };
}
