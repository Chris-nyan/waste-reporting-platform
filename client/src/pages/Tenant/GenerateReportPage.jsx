import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, UploadCloud, Sparkles, Image as ImageIcon, X, Calendar as CalendarIcon, Check } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import GeneratingAILoader from '@/components/ui/GeneratingAILoader';
import api from '@/lib/api';
import { reportSchemas } from '@/schemas/reportSchemas';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const STEPS = [
    { id: 1, title: 'Configuration' },
    { id: 2, title: 'Data Selection' },
    { id: 3, title: 'Insights' },
    { id: 4, title: 'Generate' },
];



const ImageUploadField = ({ form, name, label, icon: Icon }) => {
    const { control, watch, setValue } = form;
    const { t } = useTranslation();
    const file = watch(name);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (file && file instanceof File) {
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
            return () => URL.revokeObjectURL(previewUrl);
        } else {
            setPreview(null);
        }
    }, [file]);

    return (
        <FormField control={control} name={name} render={({ field }) => (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                    {preview ? (
                        <div className="relative w-full h-32 group">
                            <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-lg border" />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setValue(name, null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center w-full">
                            <label
                                htmlFor={`${name}-upload`}
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Icon className="w-8 h-8 mb-2 text-gray-500" />
                                    <p className="text-sm text-gray-500"><span className="font-semibold">{t('report_generator.img_upload', 'Click to upload')}</span></p>
                                </div>
                                <Input
                                    id={`${name}-upload`}
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => field.onChange(e.target.files[0])}
                                />
                            </label>
                        </div>
                    )}
                </FormControl>
                <FormMessage />
            </FormItem>
        )} />
    );
};

const Step1ConfigureReport = ({ form }) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-6">
            <FormField
                control={form.control}
                name="reportTitle"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('report_generator.step1.title', 'Report Title')}</FormLabel>
                        <FormControl>
                            <Input placeholder={t('report_generator.step1.title_placeholder', 'e.g., Q3 Sustainability Report')} {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-2 gap-6">
                <ImageUploadField form={form} name="coverImage" label={t('report_generator.step1.cover', 'Cover Image (Optional)')} icon={ImageIcon} />
                <ImageUploadField form={form} name="logo" label={t('report_generator.step1.logo', 'Company Logo (Optional)')} icon={UploadCloud} />
            </div>
        </div>
    );
};

const Step2SelectData = ({ form, masterData }) => {
    const { control, watch } = form;
    const { t } = useTranslation();
    const [availableWasteTypes, setAvailableWasteTypes] = useState([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(false);
    const clientId = watch("clientId");
    const dateRange = watch("dateRange");

    useEffect(() => {
        if (clientId && dateRange?.from && dateRange?.to) {
            setIsLoadingTypes(true);
            api.post('/reports/waste-types', { clientId, startDate: dateRange.from, endDate: dateRange.to })
                .then(res => setAvailableWasteTypes(res.data.wasteTypes))
                .finally(() => setIsLoadingTypes(false));
        } else {
            setAvailableWasteTypes([]);
        }
    }, [clientId, dateRange]);

    return (
        <div className="space-y-6">
            <FormField
                control={control}
                name="clientId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('report_generator.step2.client', 'Client')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('report_generator.step2.client_placeholder', 'Select a client')} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {masterData.clients.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="dateRange"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Reporting Period</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn("justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value?.from ? (
                                            field.value.to ? (
                                                <>
                                                    {format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(field.value.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>{t('report_generator.step2.period_placeholder', 'Pick a date range')}</span>
                                        )}
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={field.value?.from}
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name="includedWasteTypeIds"
                render={({ field }) => (
                    <FormItem>
                        <div className="mb-4">
                            <FormLabel>{t('report_generator.step2.waste_types', 'Included Waste Types')}</FormLabel>
                            <FormDescription>
                                {t('report_generator.step2.waste_types_desc', 'Select which waste types to include in the report.')}
                            </FormDescription>
                        </div>

                        {isLoadingTypes ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        ) : availableWasteTypes.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {availableWasteTypes.map((item) => {
                                    const isSelected = field.value?.includes(item.id);
                                    return (
                                        <button
                                            type="button"
                                            key={item.id}
                                            onClick={() => {
                                                if (isSelected) {
                                                    field.onChange(
                                                        field.value.filter((val) => val !== item.id)
                                                    );
                                                } else {
                                                    field.onChange([...(field.value || []), item.id]);
                                                }
                                            }}
                                            className={cn(
                                                "px-4 py-2 rounded-md text-sm font-medium border transition",
                                                isSelected
                                                    ? "bg-green-600 text-white border-green-600 shadow-sm"
                                                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                                            )}
                                        >
                                            {item.name}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-gray-50 text-center">
                                <p className="text-sm text-gray-500">
                                    {t('report_generator.step2.waste_types_empty', 'Select a client and date range to see available waste types.')}
                                </p>
                            </div>
                        )}

                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

const Step2_5IncludeWriting = ({ onSelect }) => {
    const { t } = useTranslation();
    const sampleQuestions = [
        t('report_generator.step2_5.q1', 'What are the key highlights of this report?'),
        t('report_generator.step2_5.q2', 'Any recommendations for improvement?'),
        t('report_generator.step2_5.q3', 'Additional comments or notes?')
    ];

    return (
        <div className="flex flex-col space-y-6 p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200">
            {/* Header */}
            <div className="flex flex-col space-y-2">
                <h2 className="text-xl font-semibold text-gray-800">{t('report_generator.step2_5.title', 'Include a Writing Section?')}</h2>
                <p className="text-gray-600 text-sm">
                    {t('report_generator.step2_5.desc', 'Adding a writing section allows you to provide custom insights in your report. Here are sample questions you might answer:')}
                </p>
                <div className="flex justify-center">
                    <div className="flex items-center gap-2 bg-white border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg shadow-sm">
                        <Sparkles className="h-4 w-4" />
                        <span>{t('report_generator.step2_5.ai_prompt', 'Our AI assistance is ready to help you answer these questions efficiently.')}</span>
                    </div>
                </div>
            </div>

            {/* Sample Questions Preview */}
            <ul className="flex flex-col gap-3">
                {[
                    "What are the key highlights of this report?",
                    "Any recommendations for improvement?",
                    "Additional comments or notes?"
                ].map((q, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-medium">{idx + 1}</span>
                        <p className="text-gray-700 text-sm">{q}</p>
                    </li>
                ))}
            </ul>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-2">
                <Button
                    onClick={() => onSelect(true)}
                    className="flex-1 py-3 px-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl shadow-md hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
                >
                    {t('report_generator.step2_5.yes', 'Yes, Include')}
                </Button>

                <Button
                    onClick={() => onSelect(false)}
                    className="flex-1 py-3 px-5 bg-gray-100 text-gray-700 font-medium rounded-xl border border-gray-300 shadow-sm hover:bg-gray-200 transition-all duration-300"
                >
                    {t('report_generator.step2_5.no', 'No, Skip')}
                </Button>
            </div>
        </div>
    );
};

const Step3AnswerQuestions = ({ form, questionPage }) => {
    const { t } = useTranslation();
    const { control, getValues, setValue } = form;
    const { fields } = useFieldArray({ control, name: "questions" });
    const [isGenerating, setIsGenerating] = useState(false);


    const questionsPerPage = 2;
    const pageCount = Math.ceil(fields.length / questionsPerPage);
    const currentQuestions = fields.slice(questionPage * questionsPerPage, (questionPage + 1) * questionsPerPage);

    const handleGenerateAI = async () => {
        setIsGenerating(true);
        toast.info(t('report_generator.step3.toast_generating', 'Generating AI insights, this may take a moment...'));
        const { clientId, dateRange, includedWasteTypeIds, questions } = getValues();
        try {
            const response = await api.post('/reports/generate-insights', {
                clientId,
                startDate: dateRange.from,
                endDate: dateRange.to,
                includedWasteTypeIds,
                questions: questions.map(q => ({ id: q.id, text: q.text })),
            });

            response.data.questions.forEach((answeredQuestion) => {
                const questionIndex = questions.findIndex(q => q.id === answeredQuestion.id);
                if (questionIndex !== -1) {
                    setValue(`questions.${questionIndex}.answerText`, answeredQuestion.answerText);
                }
            });

            toast.success(t('report_generator.step3.toast_success', 'AI insights generated successfully!'));
        } catch (error) {
            console.error("Error generating AI insights:", error);
            toast.error(t('report_generator.step3.toast_error', 'Failed to generate AI insights.'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSkip = () => {
        // Fill all Step 3 questions with "N/A"
        fields.forEach((_, index) =>
            setValue(`questions.${index}.answerText`, "N/A")
        );

        // Call parent to skip the step
        if (onSkip) onSkip();
    };

    return (
        <div className="flex flex-col h-full">
            {/* AI Generation / Skip Section */}
            <div
                className="p-6 rounded-2xl bg-white border border-[#00C853]/30 
    shadow-[0_6px_20px_rgba(0,0,0,0.05)] mb-6 
    flex flex-col sm:flex-row items-center justify-between gap-5 
    transition-all duration-300 hover:shadow-[0_10px_25px_rgba(52,168,83,0.15)] hover:-translate-y-[2px]"
            >
                {/* Info Section */}
                <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-xl bg-white border border-[#34A853]/20">
                        <Sparkles className="h-5 w-5 text-[#00C853]" />
                    </div>
                    <div>
                        <p
                            className="font-semibold tracking-tight text-transparent bg-clip-text 
                bg-gradient-to-r from-[#007E33] via-[#00C853] to-[#00E676]"
                        >
                            {t('report_generator.step3.ai_title', 'AI Assistance Available')}
                        </p>
                        <p className="text-sm text-gray-700 leading-snug">
                            {t('report_generator.step3.ai_desc1', 'Fill in your answers manually, or let our')}
                            <span
                                className="font-medium text-transparent bg-clip-text 
                    bg-gradient-to-r from-[#007E33] via-[#00C853] to-[#00E676]"
                            >
                                {t('report_generator.step3.ai_desc2', ' AI generate insights ')}
                            </span>{" "}
                            {t('report_generator.step3.ai_desc3', 'for you.')}
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 flex-shrink-0">

                    {/* Gradient Generate Button */}
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleGenerateAI}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                    >
                        {isGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                        ) : (
                            <Sparkles className="h-4 w-4 text-white" />
                        )}
                        <span>{t('report_generator.step3.ai_btn', 'Generate with AI')}</span>
                    </Button>
                    {/* Loader Overlay */}
                    <GeneratingAILoader isLoading={isGenerating} />
                </div>
            </div>

            {/* Questions */}
            <div className="flex-1 space-y-6 overflow-y-auto">
                {currentQuestions.map((field, index) => {
                    const overallIndex = questionPage * questionsPerPage + index;
                    return (
                        <FormField key={field.id} control={control} name={`questions.${overallIndex}.answerText`} render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>{t('report_generator.step3.question_label', 'Question {{index}}: {{text}}', { index: overallIndex + 1, text: field.text })}</FormLabel>
                                <FormControl>
                                    <Textarea placeholder={t('report_generator.step3.question_placeholder', 'Provide a detailed answer...')} className="min-h-[120px]" {...formField} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    );
                })}
            </div>
            {/* Loader Overlay */}
            <GeneratingAILoader isLoading={isGenerating} />
        </div>
    );
};
const Step4ReadyToGenerate = () => {
    const { t } = useTranslation();
    const checklistItems = [
        t('report_generator.step4.check1', 'Make sure all report sections are completed.'),
        t('report_generator.step4.check2', 'Review key highlights before generating.'),
        t('report_generator.step4.check3', 'Ensure AI insights are included as needed.')
    ];

    return (
        <div className="w-full h-full flex flex-col space-y-6 p-6 bg-gradient-to-br from-white to-gray-50 rounded-none shadow-none border-none">
            {/* Header */}
            <div className="flex flex-col space-y-2 text-center">
                <h2 className="text-2xl font-semibold text-gray-800">{t('report_generator.step4.title', 'Ready to Generate')}</h2>
                <div className="flex justify-center mt-2">
                    <div className="flex items-center gap-2 bg-white border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg shadow-sm">
                        <span>{t('report_generator.step4.desc', 'All sections are set. Click the button below to generate your report.')}</span>
                    </div>
                </div>
            </div>

            {/* Optional Info / Preview Section */}
            <ul className="flex flex-col gap-3">
                {[
                    "Make sure all report sections are completed.",
                    "Review key highlights before generating.",
                    "Ensure AI insights are included as needed."
                ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-medium">{idx + 1}</span>
                        <p className="text-gray-700 text-sm">{item}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};
// add this before GenerateReportPage component
function getSteps(t) {
  return [
    { id: 1, title: t('report_generator.step1.name', 'Configuration') },
    { id: 2, title: t('report_generator.step2.name', 'Data Selection') },
    { id: 3, title: t('report_generator.step3.name', 'Insights') },
    { id: 4, title: t('report_generator.step4.name', 'Generate') },
  ];
}


const GenerateReportPage = () => {
    const [step, setStep] = useState(1);
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [masterData, setMasterData] = useState({ clients: [], masterReportQuestions: [] });
    const navigate = useNavigate();
    const [questionPage, setQuestionPage] = useState(0);
    const [includeWritingSection, setIncludeWritingSection] = useState(null); // null = not selected, true/false = user choice
    const [step3Skipped, setStep3Skipped] = useState(false);
    const STEPS = getSteps(t); // <-- 4. GET TRANSLATED STEPS


    const form = useForm({
        resolver: zodResolver(reportSchemas),
        defaultValues: { reportTitle: t('report_generator.default_title', 'Waste Management & Sustainability Report'), clientId: undefined, dateRange: { from: undefined, to: undefined }, includedWasteTypeIds: [], questions: [], coverImage: null, logo: null },
    });

    const { replace, fields: questionFields } = useFieldArray({ control: form.control, name: "questions" });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [clientRes, masterRes] = await Promise.all([api.get('/reports/config-data'), api.get('/master-data')]);
                setMasterData({ clients: clientRes.data.clients, masterReportQuestions: masterRes.data.masterReportQuestions });
                replace(masterRes.data.masterReportQuestions.map(q => ({ id: q.id, text: q.text, answerText: '' })));
            } catch (error) {
                toast.error(t('report_generator.toast_load_error', 'Failed to load page configuration.'));
            }
        };
        fetchInitialData();
    }, [replace, t]);
    useEffect(() => {
        // Update default title if language changes
        form.reset({
            ...form.getValues(),
            reportTitle: form.getValues('reportTitle') === 'Waste Management & Sustainability Report' ? t('report_generator.default_title', 'Waste Management & Sustainability Report') : form.getValues('reportTitle')
        });
    }, [t, form]);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            // Get the latest form values
            const allFormData = form.getValues();

            // Build payload
            const payload = {
                ...allFormData,
                startDate: allFormData.dateRange.from,
                endDate: allFormData.dateRange.to,
                // Include questions only if writing section is selected
                questions: includeWritingSection ? allFormData.questions : [],
                includeWritingSection, // optional: send boolean to backend for clarity
            };

            console.log("--- SENDING PAYLOAD FROM FRONTEND ---");
            console.log(JSON.stringify(payload, null, 2));

            const response = await api.post('/reports/generate', payload);
            const newReport = response.data;

            toast.success(t('report_generator.toast_generate_success', 'Report generated successfully!'));
            navigate(`/app/reports/preview/${newReport.id}`);

        } catch (err) {
            toast.error(t('report_generator.toast_generate_error', 'Failed to generate report.'));
            console.error("Submission Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const questionsPerPage = 2;
    const questionPageCount = Math.ceil(questionFields.length / questionsPerPage);

    const handleNext = async () => {
        // Step 1 validation
        if (step === 1) {
            const isValid = await form.trigger(["reportTitle"]);
            if (isValid) setStep(2);
            return;
        }

        // Step 2 validation
        if (step === 2) {
            const isValid = await form.trigger(["clientId", "dateRange", "includedWasteTypeIds"]);
            if (isValid) setStep(2.5);
            return;
        }


        // Step 3 validation (questions)
        if (step === 3) {
            if (step3Skipped) {
                setStep(4); // skip all question pages
                return;
            }

            if (questionPage < questionPageCount - 1) {
                setQuestionPage(p => p + 1);
                return;
            }

            const questionValidations = questionFields.map((_, index) => `questions.${index}.answerText`);
            const isValid = await form.trigger(questionValidations);
            if (isValid) setStep(4);
            return;
        }
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
            return;
        }

        if (step === 3) {
            if (questionPage > 0) {
                // Go back to previous question page
                setQuestionPage(p => p - 1);
            } else {
                setStep(2); // Back to data selection
            }
            return;
        }

        if (step === 4) {
            setStep(3); // Back to last question page
        }
    };

    const progress = ((step - 1) / (STEPS.length - 1)) * 100;

    return (
        <div className="flex flex-col h-full p-4 lg:p-8">
            <div className="flex-shrink-0">
                <Link to="/app/reports" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports</Link>
                <div className="mb-6">
                    <h1 className="text-3xl font-semibold text-gray-800">{t('report_generator.title', 'Generate a New Report')}</h1>
                    <p className="text-gray-600 mt-1">{t('report_generator.desc', 'Follow the steps to create a comprehensive report.')}</p>
                    <div className="pt-4">
                        <Progress value={progress} className="w-full [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-600" />
                        <div className="flex justify-between mt-2">{STEPS.map((s, i) => (<div key={s.id} className="text-center w-1/4"><div className={`mx-auto h-6 w-6 rounded-full flex items-center justify-center ${step > i ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"}`}>{step > i ? <Check className="h-4 w-4" /> : s.id}</div><p className={`text-xs mt-1 ${step > i ? "text-gray-800 font-medium" : "text-gray-500"}`}>{s.title}</p></div>))}</div>
                    </div>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto py-4 pr-2">
                        {step === 1 && <Step1ConfigureReport form={form} />}
                        {step === 2 && <Step2SelectData form={form} masterData={masterData} />}
                        {step === 2.5 && (
                            <Step2_5IncludeWriting
                                onSelect={(choice) => {
                                    setIncludeWritingSection(choice);
                                    if (choice) {
                                        setStep(3); // go to questions
                                    } else {
                                        setStep(4); // skip questions, go to generate
                                    }
                                }}
                            />
                        )}
                        {step === 3 && (
                            <Step3AnswerQuestions
                                form={form}
                                questionPage={questionPage}
                                onSkip={() => {
                                    setStep3Skipped(true); // mark as skipped
                                    setStep(4); // jump to Step 4
                                }}
                            />
                        )}
                        {step === 4 && <Step4ReadyToGenerate />}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t flex-shrink-0 mt-auto">

                        <Link to="/app/reports">
                            <Button type="button" variant="danger" className="bg-red-600 text-white">
                                {t('report_generator.btn_cancel', 'Cancel Generating Report')}
                            </Button>
                        </Link>

                        <div className="flex items-center gap-2">

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                disabled={step === 1 && questionPage === 0}
                            >
                                {t('report_generator.btn_back', 'Back')}
                            </Button>

                            {/* Only show Next button if NOT step 2.5 */}
                            {step !== 2.5 && step < 4 && (
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                    disabled={step === 3 && step3Skipped}
                                >
                                    {step === 3 && !step3Skipped && questionPage < questionPageCount - 1
                                        ? t('report_generator.btn_next_questions', 'Next Questions')
                                        : t('report_generator.btn_next', 'Next')}
                                </Button>
                            )}

                            {step === 4 && (
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                >
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                                    {t('report_generator.btn_generate', 'Generate Report')}
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default GenerateReportPage;

