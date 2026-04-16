import axios from "axios";

type IssueVirtualBadgeInput = {
    templateId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    metadata?: Record<string, unknown>;
};

type IssueVirtualBadgeResult = {
    recipientId: string | null;
    certificateId: string | null;
    validationUrl: string | null;
    raw: unknown;
};

const api = axios.create({
    baseURL: process.env.VIRTUALBADGE_API_BASE_URL,
    headers: {
        Authorization: `Bearer ${process.env.VIRTUALBADGE_API_KEY}`,
        "Content-Type": "application/json",
    },
});

export const getVirtualBadgeTemplateId = (tier: string): string => {
    const map: Record<string, string | undefined> = {
        "Global Potential": process.env.VIRTUALBADGE_TEMPLATE_GLOBAL_POTENTIAL,
        "Global Talent": process.env.VIRTUALBADGE_TEMPLATE_GLOBAL_TALENT,
        "Global Leader": process.env.VIRTUALBADGE_TEMPLATE_GLOBAL_LEADER,
        "Global Champion": process.env.VIRTUALBADGE_TEMPLATE_GLOBAL_CHAMPION,
    };

    const templateId = map[tier];
    if (!templateId) {
        throw new Error(`No VirtualBadge template configured for tier: ${tier}`);
    }

    return templateId;
};

export const issueVirtualBadge = async (
    input: IssueVirtualBadgeInput
): Promise<IssueVirtualBadgeResult> => {
    const endpoint = process.env.VIRTUALBADGE_CREATE_RECIPIENT_ENDPOINT;
    if (!endpoint) {
        throw new Error("Missing VIRTUALBADGE_CREATE_RECIPIENT_ENDPOINT");
    }

    const [firstNameFromFull, ...rest] = (input.fullName || "").trim().split(" ");
    const derivedFirstName = input.firstName || firstNameFromFull || "Recipient";
    const derivedLastName = input.lastName || rest.join(" ") || "Badge";

    const payload = {
        certificate: input.templateId,
        send_emails: false,
        add_duplicates: true,
        recipients: [
            {
                email: input.email,
                full_name: input.fullName,

                credential_name: `Deel Global Certification - ${input.metadata?.tier}`,

                issue_date: new Date().toISOString().split("T")[0],

                dynamic_fields: {
                    score: String(input.metadata?.score),
                    tier: input.metadata?.tier,
                },

                metadata: {
                    source: "assessment",
                },
            },
        ],
    };


    const response = await api.post(endpoint, payload);

    const data = response.data;

    const recipient = data?.data?.[0];
console.log(recipient)
    return {
        recipientId: recipient?.id ?? null,
        certificateId: recipient?.certificate ?? null,
        validationUrl: recipient?.access_page_url ?? null,
        raw: data,
    };
};