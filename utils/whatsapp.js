const DEFAULT_API_VERSION = 'v25.0';
const DEFAULT_COUNTRY_CODE = '91';
const DEFAULT_TEMPLATE_LANGUAGE = 'en';
const DEFAULT_TEMPLATE_NAME = 'ready_to_pickup';

const formatWhatsAppNumber = (phoneNumber) => {
  const digits = String(phoneNumber || '').replace(/\D/g, '');
  const countryCode = process.env.WHATSAPP_COUNTRY_CODE || DEFAULT_COUNTRY_CODE;
  const localNumber = digits.replace(/^0+/, '');

  if (!digits) {
    throw new Error('Customer phone number is missing');
  }

  if (localNumber.startsWith(countryCode) && localNumber.length > countryCode.length) {
    return localNumber;
  }

  return `${countryCode}${localNumber}`;
};

const getWhatsAppConfig = () => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    return null;
  }

  return {
    accessToken,
    phoneNumberId,
    apiVersion: process.env.WHATSAPP_API_VERSION || DEFAULT_API_VERSION,
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || DEFAULT_TEMPLATE_LANGUAGE,
    templateName: process.env.WHATSAPP_READY_TEMPLATE_NAME || DEFAULT_TEMPLATE_NAME,
  };
};

const sendReadyToCollectMessage = async (order) => {
  const config = getWhatsAppConfig();

  if (!config) {
    console.warn('WhatsApp message skipped: missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID');
    return { sent: false, reason: 'missing_whatsapp_config' };
  }

  const response = await fetch(
    `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formatWhatsAppNumber(order.phoneNumber),
        type: 'template',
        template: {
          name: config.templateName,
          language: {
            code: config.templateLanguage,
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: order.customerName,
                },
                {
                  type: 'text',
                  text: order.serialNumber,
                },
              ],
            },
          ],
        },
      }),
    }
  );

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(responseBody?.error?.message || 'Failed to send WhatsApp message');
    error.details = responseBody;
    throw error;
  }

  return {
    sent: true,
    messageId: responseBody?.messages?.[0]?.id || null,
  };
};

module.exports = {
  formatWhatsAppNumber,
  sendReadyToCollectMessage,
};
