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
import api from '@/lib/api';
import { reportSchemas } from '@/schemas/reportSchemas';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const STEPS = [
    { id: 1, title: 'Configuration' },
    { id: 2, title: 'Data Selection' },
    { id: 3, title: 'Insights' },
    { id: 4, title: 'Generate' }
];



const ImageUploadField = ({ form, name, label, icon: Icon }) => {
    const { control, watch, setValue } = form;
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
                                    <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
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

const Step1ConfigureReport = ({ form }) => (
    <div className="space-y-6">
        <FormField
            control={form.control}
            name="reportTitle"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Report Title</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Q3 Sustainability Report" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <div className="grid grid-cols-2 gap-6">
            <ImageUploadField form={form} name="coverImage" label="Cover Image (Optional)" icon={ImageIcon} />
            <ImageUploadField form={form} name="logo" label="Company Logo (Optional)" icon={UploadCloud} />
        </div>
    </div>
);

const Step2SelectData = ({ form, masterData }) => {
    const { control, watch } = form;
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
                        <FormLabel>Client</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a client" />
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
                                            <span>Pick a date range</span>
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
                            <FormLabel>Included Waste Types</FormLabel>
                            <FormDescription>
                                Select which waste types to include in the report.
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
                                    Select a client and date range to see available waste types.
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

const Step3AnswerQuestions = ({ form, questionPage }) => {
    const { control, getValues, setValue } = form;
    const { fields } = useFieldArray({ control, name: "questions" });
    const [isGenerating, setIsGenerating] = useState(false);

    const questionsPerPage = 2;
    const pageCount = Math.ceil(fields.length / questionsPerPage);
    const currentQuestions = fields.slice(questionPage * questionsPerPage, (questionPage + 1) * questionsPerPage);

    const handleGenerateAI = async () => {
        setIsGenerating(true);
        toast.info("Generating AI insights, this may take a moment...");
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

            toast.success("AI insights generated successfully!");
        } catch (error) {
            console.error("Error generating AI insights:", error);
            toast.error("Failed to generate AI insights.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSkip = () => {
        fields.forEach((_, index) => { setValue(`questions.${index}.answerText`, "N/A"); });
        // The main navigation will move to Step 4
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
                            AI Assistance Available
                        </p>
                        <p className="text-sm text-gray-700 leading-snug">
                            Fill in your answers manually, or let our{" "}
                            <span
                                className="font-medium text-transparent bg-clip-text 
                    bg-gradient-to-r from-[#007E33] via-[#00C853] to-[#00E676]"
                            >
                                AI generate insights
                            </span>{" "}
                            for you.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 flex-shrink-0">
                    {/* Glass Skip Button */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSkip}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white backdrop-blur-md border border-[#00C853]/30 text-gray hover:bg-green hover:border-[#00E676]/50 
                        hover:scale-[1.03] transition-all duration-300 shadow-sm"
                    >
                        <X className="h-4 w-4" /> Skip Section
                    </Button>

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
                        <span>Generate with AI</span>
                    </Button>
                </div>
            </div>

            {/* Questions */}
            <div className="flex-1 space-y-6 overflow-y-auto">
                {currentQuestions.map((field, index) => {
                    const overallIndex = questionPage * questionsPerPage + index;
                    return (
                        <FormField key={field.id} control={control} name={`questions.${overallIndex}.answerText`} render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>{`Question ${overallIndex + 1}: ${field.text}`}</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Provide a detailed answer..." className="min-h-[120px]" {...formField} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    );
                })}
            </div>
        </div>
    );
};


const GenerateReportPage = () => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [masterData, setMasterData] = useState({ clients: [], masterReportQuestions: [] });
    const navigate = useNavigate();
    const [questionPage, setQuestionPage] = useState(0);

    const form = useForm({
        resolver: zodResolver(reportSchemas),
        defaultValues: { reportTitle: "Waste Management & Sustainability Report", clientId: undefined, dateRange: { from: undefined, to: undefined }, includedWasteTypeIds: [], questions: [], coverImage: null, logo: null },
    });

    const { replace, fields: questionFields } = useFieldArray({ control: form.control, name: "questions" });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [clientRes, masterRes] = await Promise.all([api.get('/reports/config-data'), api.get('/master-data')]);
                setMasterData({ clients: clientRes.data.clients, masterReportQuestions: masterRes.data.masterReportQuestions });
                replace(masterRes.data.masterReportQuestions.map(q => ({ id: q.id, text: q.text, answerText: '' })));
            } catch (error) {
                toast.error("Failed to load page configuration.");
            }
        };
        fetchInitialData();
    }, [replace]);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            // --- FIX: Manually get the latest values from the form state ---
            const allFormData = form.getValues();

            const payload = {
                ...allFormData, // Use the complete form data
                startDate: allFormData.dateRange.from,
                endDate: allFormData.dateRange.to
            };
            // --- END FIX ---

            console.log("--- SENDING PAYLOAD FROM FRONTEND ---");
            console.log(JSON.stringify(payload, null, 2));

            const response = await api.post('/reports/generate', payload);
            const newReport = response.data;

            toast.success("Report generated successfully!");
            navigate(`/app/reports/preview/${newReport.id}`);

        } catch (err) {
            toast.error("Failed to generate report.");
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
            if (isValid) setStep(3);
            return;
        }

        // Step 3 validation (questions)
        if (step === 3) {
            const questionsPerPage = 2;
            const questionPageCount = Math.ceil(questionFields.length / questionsPerPage);

            if (questionPage < questionPageCount - 1) {
                // Move to next question page without validating all questions yet
                setQuestionPage(p => p + 1);
                return;
            }

            // Last question page: validate ALL questions
            const questionValidations = questionFields.map((_, index) => `questions.${index}.answerText`);
            const isValid = await form.trigger(questionValidations);

            if (isValid) setStep(4); // Move to Generate step
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
                    <h1 className="text-3xl font-semibold text-gray-800">Generate a New Report</h1>
                    <p className="text-gray-600 mt-1">Follow the steps to create a comprehensive report.</p>
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
                        {step === 3 && <Step3AnswerQuestions form={form} questionPage={questionPage} />}
                        {step === 4 && <div><h3 className="text-lg font-medium">Ready to Generate</h3><p className="text-sm text-gray-500 mt-2">Click the button below to generate your report.</p></div>}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t flex-shrink-0 mt-auto">
                        <Button type="button" variant="outline" onClick={handleBack} disabled={step === 1 && questionPage === 0}>Back</Button>
                        <div className="flex items-center gap-2">
                            <Link to="/app/reports"><Button type="button" variant="ghost">Cancel</Button></Link>
                            {step < STEPS.length && (
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                >
                                    {step === 3 && questionPage < questionPageCount - 1 ? 'Next Questions' : 'Next'}
                                </Button>
                            )}
                            {step === STEPS.length && (
                                <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate Report
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

