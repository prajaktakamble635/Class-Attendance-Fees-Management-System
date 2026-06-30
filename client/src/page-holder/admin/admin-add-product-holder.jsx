import { useMaterialTailwindController } from "@/context/index.jsx";
import { handleError } from "@/hooks/errorHandling";
import { validateFormData } from "@/hooks/validation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Chip,
  IconButton,
  Input,
  Tab,
  TabPanel,
  Tabs,
  TabsBody,
  TabsHeader,
  Textarea,
  Typography
} from "@material-tailwind/react";
import axios from "axios";
import {
  Image as ImageIcon,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactSelect from "react-select";
import { toast } from "react-toastify";

export default function AddProductHolder() {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    shortDescription: "",
    description: "",
    excerpt: "",
    hsn: "",
    gstPercent: "",
    weight: "",
    unit: "",
    categoryIdFk: "",
    subCategoryIdFk: "",
    stockBehaviour: "",
    visibleFrom: "",
    visibleTo: "",
    isFeatured: 0,
    sortOrder: "",
    forInternational: 1,
    forDomestic: 1,
    forLocal: 1,
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: "",
    canonicalUrl: "",
    metaRobots: "index, follow",
  });

  const [images, setImages] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [structuredDataFields, setStructuredDataFields] = useState([]);

  // Fixed 3 prices for Local, Domestic, International
  const [prices, setPrices] = useState([
    {
      priceFor: 1,
      priceLabel: "Local Price",
      mrp: "",
      sellingPrice: "",
      offerPrice: "",
      fromDate: "",
      toDate: "",
      priceType: "default",
      currencyIdFk: 1,
    },
    {
      priceFor: 2,
      priceLabel: "Domestic Price",
      mrp: "",
      sellingPrice: "",
      offerPrice: "",
      fromDate: "",
      toDate: "",
      priceType: "default",
      currencyIdFk: 1,
    },
    {
      priceFor: 3,
      priceLabel: "International Price",
      mrp: "",
      sellingPrice: "",
      offerPrice: "",
      fromDate: "",
      toDate: "",
      priceType: "default",
      currencyIdFk: 1,
    },
  ]);

  const [stocks, setStocks] = useState([
    { qtyAvailable: "", qtyReserved: "", reorderLevel: "", warehouseIdFk: "" },
  ]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);
  const [tagList, setTagList] = useState([]);
  const [warehouseList, setWarehouseList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const metaRobotsOptions = [
    "index, follow",
    "noindex, follow",
    "index, nofollow",
    "noindex, nofollow",
    "noarchive",
    "nosnippet",
    "noimageindex",
  ];

  useEffect(() => {
    document.title = "SproutEdge Agro - Add Product";
    fetchCategories();
    fetchTags();
    fetchWarehouses();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/getActiveCategoryList`
      );
      if (response.status === 200)
        setCategoryList(response.data.categories || []);
    } catch (error) {
      handleError(error);
    }
  };

  const fetchSubCategories = async (categoryId) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/getActiveSubCategoryList`,
        { categoryId }
      );
      if (response.status === 200)
        setSubCategoryList(response.data.subCategories || []);
    } catch (error) {
      handleError(error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/getActiveTagsList`
      );
      if (response.status === 200) setTagList(response.data.tags || []);
    } catch (error) {
      handleError(error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/getActiveWarehouseList`
      );
      if (response.status === 200)
        setWarehouseList(response.data.warehouses || []);
    } catch (error) {
      handleError(error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    });
  };

  const handleCategoryChange = (value) => {
    setFormData({ ...formData, categoryIdFk: value, subCategoryIdFk: "" });
    setSubCategoryList([]);
    if (value) fetchSubCategories(value);
  };

  // Image handling
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 10) {
      toast.error("Maximum 10 images allowed", { theme });
      return;
    }

    const newImages = files.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      altText: "",
      title: "",
      position: images.length + index + 1,
      isPrimary: images.length === 0 && index === 0 ? 1 : 2,
    }));

    setImages([...images, ...newImages]);
    e.target.value = null;
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    // Update positions
    newImages.forEach((img, i) => {
      img.position = i + 1;
      if (i === 0 && images[index].isPrimary === 1) img.isPrimary = 1;
    });
    setImages(newImages);
  };

  const setPrimaryImage = (index) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index ? 1 : 2,
    }));
    setImages(newImages);
  };

  const updateImageField = (index, field, value) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], [field]: value };
    setImages(newImages);
  };

  // Attributes
  const addAttribute = () =>
    setAttributes([...attributes, { name: "", value: "" }]);
  const removeAttribute = (index) =>
    setAttributes(attributes.filter((_, i) => i !== index));
  const updateAttribute = (index, field, value) => {
    const newAttrs = [...attributes];
    newAttrs[index] = { ...newAttrs[index], [field]: value };
    setAttributes(newAttrs);
  };

  // FAQs
  const addFaq = () => setFaqs([...faqs, { question: "", answer: "" }]);
  const removeFaq = (index) => setFaqs(faqs.filter((_, i) => i !== index));
  const updateFaq = (index, field, value) => {
    const newFaqs = [...faqs];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    setFaqs(newFaqs);
  };

  // Highlights
  const addHighlight = () => setHighlights([...highlights, { text: "" }]);
  const removeHighlight = (index) =>
    setHighlights(highlights.filter((_, i) => i !== index));
  const updateHighlight = (index, value) => {
    const newHighlights = [...highlights];
    newHighlights[index] = { text: value };
    setHighlights(newHighlights);
  };

  // Specifications
  const addSpecification = () =>
    setSpecifications([...specifications, { name: "", value: "" }]);
  const removeSpecification = (index) =>
    setSpecifications(specifications.filter((_, i) => i !== index));
  const updateSpecification = (index, field, value) => {
    const newSpecs = [...specifications];
    newSpecs[index] = { ...newSpecs[index], [field]: value };
    setSpecifications(newSpecs);
  };

  // Structured Data
  const addStructuredDataField = () =>
    setStructuredDataFields([...structuredDataFields, { key: "", value: "" }]);
  const removeStructuredDataField = (index) =>
    setStructuredDataFields(structuredDataFields.filter((_, i) => i !== index));
  const updateStructuredDataField = (index, field, value) => {
    const newFields = [...structuredDataFields];
    newFields[index] = { ...newFields[index], [field]: value };
    setStructuredDataFields(newFields);
  };

  // Prices
  const updatePrice = (index, field, value) => {
    const newPrices = [...prices];
    newPrices[index] = { ...newPrices[index], [field]: value };
    setPrices(newPrices);
  };

  // Stocks
  const addStock = () =>
    setStocks([
      ...stocks,
      {
        qtyAvailable: "",
        qtyReserved: "",
        reorderLevel: "",
        warehouseIdFk: "",
      },
    ]);
  const removeStock = (index) => {
    setStocks(stocks.filter((_, i) => i !== index));
  };

  const updateStock = (index, field, value) => {
    const newStocks = [...stocks];
    newStocks[index] = { ...newStocks[index], [field]: value };
    setStocks(newStocks);
  };

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationRules = [
      { field: "name", required: true, message: "Please enter product name." },
    ];
    const hasError = validateFormData(formData, validationRules, theme);
    if (hasError) return;

    setIsSubmitting(true);

    try {
      const submitData = new FormData();

      // Basic fields
      Object.keys(formData).forEach((key) => {
        if (
          formData[key] !== "" &&
          formData[key] !== null &&
          formData[key] !== undefined
        ) {
          submitData.append(key, formData[key]);
        }
      });

      // Images
      images.forEach((img, index) => {
        submitData.append("images", img.file);
        if (img.altText) submitData.append(`altText_${index}`, img.altText);
        if (img.title) submitData.append(`imageTitle_${index}`, img.title);
        submitData.append(`position_${index}`, img.position);
        submitData.append(`isPrimary_${index}`, img.isPrimary);
      });

      // Convert arrays to JSON
      if (attributes.length > 0) {
        const attrsObj = {};
        attributes.forEach((attr) => {
          if (attr.name && attr.value) attrsObj[attr.name] = attr.value;
        });
        submitData.append("attributes", JSON.stringify(attrsObj));
      }

      if (faqs.length > 0) {
        const faqsArray = faqs
          .filter((f) => f.question && f.answer)
          .map((f) => ({ q: f.question, a: f.answer }));
        if (faqsArray.length > 0)
          submitData.append("faq", JSON.stringify(faqsArray));
      }

      if (highlights.length > 0) {
        const highlightsArray = highlights
          .filter((h) => h.text)
          .map((h) => h.text);
        if (highlightsArray.length > 0)
          submitData.append("highlights", JSON.stringify(highlightsArray));
      }

      if (specifications.length > 0) {
        const specsObj = {};
        specifications.forEach((spec) => {
          if (spec.name && spec.value) specsObj[spec.name] = spec.value;
        });
        submitData.append("specifications", JSON.stringify(specsObj));
      }

      if (structuredDataFields.length > 0) {
        const structuredObj = {};
        structuredDataFields.forEach((field) => {
          if (field.key && field.value) structuredObj[field.key] = field.value;
        });
        submitData.append("structuredData", JSON.stringify(structuredObj));
      }

      // Prices - only send filled ones
      const validPrices = prices.filter((p) => p.mrp || p.sellingPrice);
      if (validPrices.length > 0)
        submitData.append("prices", JSON.stringify(validPrices));

      // Stocks
      const validStocks = stocks.filter(
        (s) => s.qtyAvailable && s.warehouseIdFk
      );
      if (validStocks.length > 0)
        submitData.append("stocks", JSON.stringify(validStocks));

      // Tags
      if (selectedTags.length > 0)
        submitData.append("tags", JSON.stringify(selectedTags));

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/productApi/createProduct`,
        submitData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Product created successfully!", {
          position: "top-center",
          theme,
        });
        navigate("/admin/products");
      }
    } catch (error) {
      handleError(error, theme);
      if (error.response?.status === 401)
        navigate("/auth/sign-in", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in mb-8 mt-12">
      <Card className="shadow-2xl">
        <CardHeader
          variant="gradient"
          color={sidenavColor}
          className="mb-8 p-6"
        >
          <div className="flex items-center justify-between">
            <Typography variant="h4" color="white" className="font-bold">
              <i className="fas fa-box-open mr-3" />
              Add New Product
            </Typography>
            <Button
              variant="outlined"
              color="white"
              size="sm"
              onClick={() => navigate("/admin/products")}
              className="flex items-center gap-2"
            >
              <i className="fas fa-arrow-left" />
              Back to Products
            </Button>
          </div>
        </CardHeader>
        <CardBody className="px-6">
          <form onSubmit={handleSubmit}>
            <Tabs value="basic">
              <TabsHeader className="bg-blue-gray-50">
                <Tab value="basic" className="font-semibold">
                  <i className="fas fa-info-circle mr-2" />
                  Basic Info
                </Tab>
                <Tab value="images" className="font-semibold">
                  <ImageIcon className="mr-2 inline h-4 w-4" />
                  Images
                </Tab>
                <Tab value="pricing" className="font-semibold">
                  <i className="fas fa-tags mr-2" />
                  Pricing
                </Tab>
                <Tab value="stock" className="font-semibold">
                  <i className="fas fa-warehouse mr-2" />
                  Stock
                </Tab>
                <Tab value="seo" className="font-semibold">
                  <i className="fas fa-search mr-2" />
                  SEO
                </Tab>
                <Tab value="additional" className="font-semibold">
                  <i className="fas fa-plus-circle mr-2" />
                  Additional
                </Tab>
              </TabsHeader>
              <TabsBody className="mt-6">
                {/* BASIC INFO TAB */}
                <TabPanel value="basic" className="p-0">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Input
                        label="Product Name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        size="lg"
                        icon={<i className="fas fa-box" />}
                      />
                    </div>
                    <Input
                      label="SKU"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      icon={<i className="fas fa-barcode" />}
                    />
                    <Input
                      label="HSN Code"
                      name="hsn"
                      value={formData.hsn}
                      onChange={handleInputChange}
                      icon={<i className="fas fa-hashtag" />}
                    />
                    <div>
                      <label className="mb-1 block text-sm text-blue-gray-700">
                        Category
                      </label>
                      <ReactSelect
                        options={categoryList}
                        value={
                          categoryList.find(
                            (cat) => cat.value === formData.categoryIdFk
                          ) || null
                        }
                        onChange={(selectedOption) =>
                          handleCategoryChange(selectedOption?.value || "")
                        }
                        placeholder="Select Category"
                        isClearable
                        className="react-select-container"
                        classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-blue-gray-700">
                        Sub-Category
                      </label>
                      <ReactSelect
                        options={subCategoryList}
                        value={
                          subCategoryList.find(
                            (sub) => sub.value === formData.subCategoryIdFk
                          ) || null
                        }
                        onChange={(selectedOption) =>
                          setFormData({
                            ...formData,
                            subCategoryIdFk: selectedOption?.value || "",
                          })
                        }
                        placeholder="Select Sub-Category"
                        isClearable
                        isDisabled={!formData.categoryIdFk}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                      />
                    </div>

                    <Input
                      label="GST Percentage"
                      name="gstPercent"
                      type="number"
                      step="0.01"
                      value={formData.gstPercent}
                      onChange={handleInputChange}
                      icon={<i className="fas fa-percent" />}
                    />
                    <Input
                      label="Weight"
                      name="weight"
                      type="number"
                      step="0.01"
                      value={formData.weight}
                      onChange={handleInputChange}
                      icon={<i className="fas fa-weight" />}
                    />
                    <Input
                      label="Unit"
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      placeholder="kg, g, l, ml, pcs"
                      icon={<i className="fas fa-ruler" />}
                    />
                    <Input
                      label="Sort Order"
                      name="sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={handleInputChange}
                      icon={<i className="fas fa-sort-numeric-down" />}
                    />
                    <div className="md:col-span-2">
                      <Textarea
                        label="Short Description"
                        name="shortDescription"
                        value={formData.shortDescription}
                        onChange={handleInputChange}
                        rows={2}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Textarea
                        label="Full Description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={5}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Textarea
                        label="Excerpt"
                        name="excerpt"
                        value={formData.excerpt}
                        onChange={handleInputChange}
                        rows={2}
                      />
                    </div>
                    <div className="rounded-lg bg-blue-gray-50 p-4 md:col-span-2">
                      <Typography
                        variant="h6"
                        className="mb-3 text-blue-gray-700"
                      >
                        Visibility Options
                      </Typography>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <Checkbox
                          label={
                            <span className="font-semibold">
                              Featured Product
                            </span>
                          }
                          checked={formData.isFeatured === 1}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isFeatured: e.target.checked ? 1 : 0,
                            })
                          }
                        />
                        <Checkbox
                          label={
                            <span className="font-semibold">
                              Global Fresh Connect
                            </span>
                          }
                          checked={formData.forInternational === 1}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              forInternational: e.target.checked ? 1 : 0,
                            })
                          }
                        />
                        <Checkbox
                          label={
                            <span className="font-semibold">
                              Bharat Fresh Hub
                            </span>
                          }
                          checked={formData.forDomestic === 1}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              forDomestic: e.target.checked ? 1 : 0,
                            })
                          }
                        />
                        <Checkbox
                          label={
                            <span className="font-semibold">Daily Basket</span>
                          }
                          checked={formData.forLocal === 1}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              forLocal: e.target.checked ? 1 : 0,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </TabPanel>

                {/* IMAGES TAB */}
                <TabPanel value="images" className="p-0">
                  <div className="space-y-6">
                    <div className="rounded-lg border-2 border-dashed border-blue-gray-200 bg-blue-gray-50 p-8 text-center transition-colors hover:bg-blue-gray-100">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="mx-auto mb-4 h-12 w-12 text-blue-gray-400" />
                        <Typography variant="h6" className="mb-2">
                          Upload Product Images
                        </Typography>
                        <Typography variant="small" className="text-gray-600">
                          Click to browse or drag and drop
                        </Typography>
                        <Typography
                          variant="small"
                          className="mt-2 text-gray-500"
                        >
                          Maximum 10 images | Automatically converted to WebP
                        </Typography>
                      </label>
                    </div>

                    {images.length > 0 && (
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {images.map((img, index) => (
                          <div
                            key={index}
                            className="relative rounded-xl border-2 border-blue-gray-100 bg-white p-4 shadow-md transition-shadow hover:shadow-lg"
                          >
                            <div className="relative mb-4">
                              <img
                                src={img.preview}
                                alt={`Preview ${index + 1}`}
                                className="h-48 w-full rounded-lg object-cover"
                              />
                              <IconButton
                                size="sm"
                                color="red"
                                className="absolute right-2 top-2"
                                onClick={() => removeImage(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </IconButton>
                              <div className="absolute left-2 top-2 flex gap-2">
                                <Chip
                                  value={`#${img.position}`}
                                  size="sm"
                                  className="bg-blue-500"
                                />
                                {img.isPrimary === 1 && (
                                  <Chip
                                    value="Primary"
                                    size="sm"
                                    className="bg-amber-500"
                                    icon={<Star className="h-3 w-3" />}
                                  />
                                )}
                              </div>
                              {img.isPrimary !== 1 && (
                                <Button
                                  size="sm"
                                  color="amber"
                                  className="absolute bottom-2 left-2 right-2"
                                  onClick={() => setPrimaryImage(index)}
                                >
                                  <Star className="mr-1 h-4 w-4" /> Set as
                                  Primary
                                </Button>
                              )}
                            </div>
                            <div className="space-y-3">
                              <Input
                                label="Alt Text"
                                value={img.altText}
                                onChange={(e) =>
                                  updateImageField(
                                    index,
                                    "altText",
                                    e.target.value
                                  )
                                }
                                size="sm"
                              />
                              <Input
                                label="Image Title"
                                value={img.title}
                                onChange={(e) =>
                                  updateImageField(
                                    index,
                                    "title",
                                    e.target.value
                                  )
                                }
                                size="sm"
                              />
                              <Input
                                label="Position"
                                type="number"
                                value={img.position}
                                onChange={(e) =>
                                  updateImageField(
                                    index,
                                    "position",
                                    e.target.value
                                  )
                                }
                                size="sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabPanel>

                {/* PRICING TAB */}
                <TabPanel value="pricing" className="p-0">
                  <Typography variant="h6" className="mb-4 text-blue-gray-700">
                    <i className="fas fa-dollar-sign mr-2" />
                    Configure Pricing for Different Markets
                  </Typography>
                  <div className="space-y-6">
                    {prices.map((price, index) => (
                      <div
                        key={index}
                        className="rounded-xl border-2 border-blue-gray-100 bg-gradient-to-r from-blue-50 to-white p-6"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <Typography
                            variant="h6"
                            className="text-blue-gray-800"
                          >
                            {price.priceFor === 1 && (
                              <>
                                <i className="fas fa-home mr-2 text-green-500" />
                                Daily Basket
                              </>
                            )}
                            {price.priceFor === 2 && (
                              <>
                                <i className="fas fa-flag mr-2 text-blue-500" />
                                Bharat Fresh Hub
                              </>
                            )}
                            {price.priceFor === 3 && (
                              <>
                                <i className="fas fa-globe mr-2 text-purple-500" />
                                Global Fresh Connect
                              </>
                            )}
                          </Typography>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <Input
                            label="MRP (₹)"
                            type="number"
                            step="0.01"
                            value={price.mrp}
                            onChange={(e) =>
                              updatePrice(index, "mrp", e.target.value)
                            }
                            icon={<i className="fas fa-tag" />}
                          />
                          <Input
                            label="Selling Price (₹)"
                            type="number"
                            step="0.01"
                            value={price.sellingPrice}
                            onChange={(e) =>
                              updatePrice(index, "sellingPrice", e.target.value)
                            }
                            icon={<i className="fas fa-rupee-sign" />}
                          />
                          <Input
                            label="Offer Price (₹)"
                            type="number"
                            step="0.01"
                            value={price.offerPrice}
                            onChange={(e) =>
                              updatePrice(index, "offerPrice", e.target.value)
                            }
                            icon={<i className="fas fa-percentage" />}
                          />
                          <Input
                            label="Valid From"
                            type="date"
                            value={price.fromDate}
                            onChange={(e) =>
                              updatePrice(index, "fromDate", e.target.value)
                            }
                          />
                          <Input
                            label="Valid To"
                            type="date"
                            value={price.toDate}
                            onChange={(e) =>
                              updatePrice(index, "toDate", e.target.value)
                            }
                          />
                          {/* <Input
                            label="Price Label"
                            value={price.priceLabel}
                            onChange={(e) =>
                              updatePrice(index, "priceLabel", e.target.value)
                            }
                            placeholder="e.g., Special Price"
                          /> */}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabPanel>

                {/* STOCK TAB */}
                <TabPanel value="stock" className="p-0">
                  <div className="mb-6 flex items-center justify-between">
                    <Typography variant="h6" className="text-blue-gray-700">
                      <i className="fas fa-warehouse mr-2" />
                      Warehouse Stock Management
                    </Typography>
                    <Button
                      onClick={addStock}
                      color={sidenavColor}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" /> Add Warehouse
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {stocks.map((stock, index) => (
                      <div
                        key={index}
                        className="rounded-xl border-2 border-blue-gray-100 bg-white p-6 shadow-sm"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <Typography
                            variant="h6"
                            className="text-blue-gray-700"
                          >
                            Warehouse #{index + 1}
                          </Typography>
                          {stocks.length > 1 && (
                            <IconButton
                              size="sm"
                              color="red"
                              variant="text"
                              onClick={() => removeStock(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </IconButton>
                          )}
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                          <div>
                            <label className="mb-1 block text-sm text-blue-gray-700">
                              Select Warehouse *
                            </label>
                            <ReactSelect
                              options={warehouseList}
                              value={
                                warehouseList.find(
                                  (wh) => wh.value === stock.warehouseIdFk
                                ) || null
                              }
                              onChange={(selectedOption) =>
                                updateStock(
                                  index,
                                  "warehouseIdFk",
                                  selectedOption?.value || ""
                                )
                              }
                              placeholder="Choose Warehouse"
                              isClearable
                              className="react-select-container"
                              classNamePrefix="react-select"
                              menuPortalTarget={document.body}
                              styles={{
                                menuPortal: (base) => ({
                                  ...base,
                                  zIndex: 9999,
                                }),
                              }}
                            />
                          </div>
                          <div className="self-end">
                            <Input
                              label="Quantity Available *"
                              type="number"
                              step="0.001"
                              value={stock.qtyAvailable}
                              onChange={(e) =>
                                updateStock(
                                  index,
                                  "qtyAvailable",
                                  e.target.value
                                )
                              }
                              icon={<i className="fas fa-boxes" />}
                            />
                          </div>
                          <div className="self-end">
                            <Input
                              label="Quantity Reserved"
                              type="number"
                              step="0.001"
                              value={stock.qtyReserved}
                              onChange={(e) =>
                                updateStock(
                                  index,
                                  "qtyReserved",
                                  e.target.value
                                )
                              }
                              icon={<i className="fas fa-lock" />}
                            />
                          </div>
                          <div className="self-end">
                            <Input
                              label="Reorder Level"
                              type="number"
                              step="0.001"
                              value={stock.reorderLevel}
                              onChange={(e) =>
                                updateStock(
                                  index,
                                  "reorderLevel",
                                  e.target.value
                                )
                              }
                              icon={<i className="fas fa-bell" />}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabPanel>

                {/* SEO TAB */}
                <TabPanel value="seo" className="p-0">
                  <div className="space-y-6">
                    <div className="rounded-lg bg-blue-50 p-4">
                      <Typography
                        variant="h6"
                        className="mb-4 text-blue-gray-800"
                      >
                        <i className="fas fa-search mr-2" />
                        Search Engine Optimization
                      </Typography>
                      <div className="grid grid-cols-1 gap-4">
                        <Input
                          label="Meta Title"
                          name="metaTitle"
                          value={formData.metaTitle}
                          onChange={handleInputChange}
                          icon={<i className="fas fa-heading" />}
                        />
                        <Textarea
                          label="Meta Description"
                          name="metaDescription"
                          value={formData.metaDescription}
                          onChange={handleInputChange}
                          rows={3}
                        />
                        <Input
                          label="Meta Keywords"
                          name="metaKeywords"
                          value={formData.metaKeywords}
                          onChange={handleInputChange}
                        />
                        {/* <Select
                          label="Meta Robots"
                          value={formData.metaRobots}
                          onChange={(value) =>
                            setFormData({ ...formData, metaRobots: value })
                          }
                        >
                          {metaRobotsOptions.map((option) => (
                            <Option key={option} value={option}>
                              {option}
                            </Option>
                          ))}
                        </Select> */}
                        {/* <Input
                          label="Canonical URL"
                          name="canonicalUrl"
                          value={formData.canonicalUrl}
                          onChange={handleInputChange}
                        /> */}
                      </div>
                    </div>

                    <div className="rounded-lg bg-purple-50 p-4">
                      <Typography
                        variant="h6"
                        className="mb-4 text-blue-gray-800"
                      >
                        <i className="fab fa-facebook mr-2" />
                        Open Graph (Social Media)
                      </Typography>
                      <div className="grid grid-cols-1 gap-4">
                        <Input
                          label="OG Title"
                          name="ogTitle"
                          value={formData.ogTitle}
                          onChange={handleInputChange}
                        />
                        <Textarea
                          label="OG Description"
                          name="ogDescription"
                          value={formData.ogDescription}
                          onChange={handleInputChange}
                          rows={3}
                        />
                        {/* <Input
                          label="OG Image URL"
                          name="ogImageUrl"
                          value={formData.ogImageUrl}
                          onChange={handleInputChange}
                        /> */}
                      </div>
                    </div>
                  </div>
                </TabPanel>

                {/* ADDITIONAL TAB */}
                <TabPanel value="additional" className="p-0">
                  <div className="space-y-8">
                    {/* Tags */}
                    <div className="rounded-xl bg-green-50 p-6">
                      <Typography
                        variant="h6"
                        className="mb-4 text-blue-gray-800"
                      >
                        <i className="fas fa-tags mr-2" />
                        Product Tags
                      </Typography>
                      <div className="flex flex-wrap gap-3">
                        {tagList.map((tag) => (
                          <Chip
                            key={tag.value}
                            value={tag.label}
                            onClick={() => toggleTag(tag.value)}
                            variant={
                              selectedTags.includes(tag.value)
                                ? "filled"
                                : "outlined"
                            }
                            color={
                              selectedTags.includes(tag.value)
                                ? "green"
                                : "blue-gray"
                            }
                            className="cursor-pointer transition-all hover:scale-105"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Attributes */}
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <Typography variant="h6" className="text-blue-gray-700">
                          <i className="fas fa-list-ul mr-2" />
                          Product Attributes
                        </Typography>
                        <Button
                          onClick={addAttribute}
                          color="blue"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" /> Add Attribute
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {attributes.map((attr, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <Input
                              label="Attribute Name"
                              value={attr.name}
                              onChange={(e) =>
                                updateAttribute(index, "name", e.target.value)
                              }
                            />
                            <Input
                              label="Value"
                              value={attr.value}
                              onChange={(e) =>
                                updateAttribute(index, "value", e.target.value)
                              }
                            />
                            <IconButton
                              size="sm"
                              color="red"
                              onClick={() => removeAttribute(index)}
                            >
                              <X className="h-4 w-4" />
                            </IconButton>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* FAQs */}
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <Typography variant="h6" className="text-blue-gray-700">
                          <i className="fas fa-question-circle mr-2" />
                          Frequently Asked Questions
                        </Typography>
                        <Button
                          onClick={addFaq}
                          color="purple"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" /> Add FAQ
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {faqs.map((faq, index) => (
                          <div
                            key={index}
                            className="rounded-lg border-2 border-purple-100 bg-purple-50 p-4"
                          >
                            <div className="mb-3 flex items-start justify-between">
                              <Typography
                                variant="small"
                                className="font-bold text-purple-900"
                              >
                                FAQ #{index + 1}
                              </Typography>
                              <IconButton
                                size="sm"
                                color="red"
                                variant="text"
                                onClick={() => removeFaq(index)}
                              >
                                <X className="h-4 w-4" />
                              </IconButton>
                            </div>
                            <div className="space-y-3">
                              <Input
                                label="Question"
                                value={faq.question}
                                onChange={(e) =>
                                  updateFaq(index, "question", e.target.value)
                                }
                              />
                              <Textarea
                                label="Answer"
                                value={faq.answer}
                                onChange={(e) =>
                                  updateFaq(index, "answer", e.target.value)
                                }
                                rows={2}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Highlights */}
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <Typography variant="h6" className="text-blue-gray-700">
                          <i className="fas fa-star mr-2" />
                          Product Highlights
                        </Typography>
                        <Button
                          onClick={addHighlight}
                          color="amber"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" /> Add Highlight
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {highlights.map((highlight, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <Input
                              label={`Highlight #${index + 1}`}
                              value={highlight.text}
                              onChange={(e) =>
                                updateHighlight(index, e.target.value)
                              }
                              icon={
                                <i className="fas fa-check-circle text-amber-500" />
                              }
                            />
                            <IconButton
                              size="sm"
                              color="red"
                              onClick={() => removeHighlight(index)}
                            >
                              <X className="h-4 w-4" />
                            </IconButton>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Specifications */}
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <Typography variant="h6" className="text-blue-gray-700">
                          <i className="fas fa-cog mr-2" />
                          Product Specifications
                        </Typography>
                        <Button
                          onClick={addSpecification}
                          color="indigo"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" /> Add Specification
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {specifications.map((spec, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <Input
                              label="Specification Name"
                              value={spec.name}
                              onChange={(e) =>
                                updateSpecification(
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                            />
                            <Input
                              label="Value"
                              value={spec.value}
                              onChange={(e) =>
                                updateSpecification(
                                  index,
                                  "value",
                                  e.target.value
                                )
                              }
                            />
                            <IconButton
                              size="sm"
                              color="red"
                              onClick={() => removeSpecification(index)}
                            >
                              <X className="h-4 w-4" />
                            </IconButton>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Structured Data */}
                    {/* <div> */}
                      {/* <div className="mb-4 flex items-center justify-between">
                        <Typography variant="h6" className="text-blue-gray-700">
                          <i className="fas fa-code mr-2" />
                          Structured Data (Schema.org)
                        </Typography>
                        <Button
                          onClick={addStructuredDataField}
                          color="teal"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" /> Add Field
                        </Button>
                      </div> */}
                      {/* <div className="space-y-3">
                        {structuredDataFields.map((field, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <Input
                              label="Property Name"
                              value={field.key}
                              onChange={(e) =>
                                updateStructuredDataField(
                                  index,
                                  "key",
                                  e.target.value
                                )
                              }
                            />
                            <Input
                              label="Value"
                              value={field.value}
                              onChange={(e) =>
                                updateStructuredDataField(
                                  index,
                                  "value",
                                  e.target.value
                                )
                              }
                            />
                            <IconButton
                              size="sm"
                              color="red"
                              onClick={() => removeStructuredDataField(index)}
                            >
                              <X className="h-4 w-4" />
                            </IconButton>
                          </div>
                        ))}
                      </div> */}
                    {/* </div> */}
                  </div>
                </TabPanel>
              </TabsBody>
            </Tabs>

            <div className="mt-8 flex justify-end gap-4 border-t pt-6">
              <Button
                variant="outlined"
                size="lg"
                onClick={() => navigate("/admin/products")}
                disabled={isSubmitting}
              >
                <i className="fas fa-times mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                color={sidenavColor}
                size="lg"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save" />
                    Create Product
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
