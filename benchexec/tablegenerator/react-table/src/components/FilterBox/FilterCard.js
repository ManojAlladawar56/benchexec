import React from "react";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Slider, { createSliderWithTooltip } from "rc-slider";
import "rc-slider/assets/index.css";

import { without, pathOr } from "../../utils/utils";

const Range = createSliderWithTooltip(Slider.Range);

let debounceHandler = setTimeout(() => {}, 500);

export default class FilterCard extends React.PureComponent {
  constructor(props) {
    super(props);
    const { values, min, max, type } = props.filter || { values: [] };
    let currentMin = 0;
    let currentMax = 0;
    if (type === "measure" || type === "number") {
      currentMin = min;
      currentMax = max;
      const value = values && values[0];
      if (value && value.includes(":")) {
        const res = this.handleMinMaxValue(value);
        currentMin = res.min;
        currentMax = res.max;
      }
    }
    this.state = {
      title:
        props.availableFilters && props.availableFilters.length
          ? props.availableFilters[0].title
          : "",
      values: [],
      idx: pathOr(["availableFilters", 0, "idx"], 0, props),
      active: true,
      selectedDistincts: [],
      currentMin,
      currentMax,
    };
  }

  sendFilterUpdate(values) {
    this.props.onFilterUpdate({
      values,
      title: this.state.title || this.props.title,
    });
  }

  componentDidUpdate(prevProps, prevState) {
    console.log("filtercard updates", {
      prevProps,
      newProps: { ...this.props },
      prevState,
      newState: this.state,
    });
    if (!this.props.filter) {
      return;
    }
    if (
      !prevProps.filter ||
      prevProps.filter.values !== this.props.filter.values
    ) {
      const { values } = this.props.filter;
      console.log("filtercard decided to update: ", values);
      const [value] = values;
      if (value && value.includes(":")) {
        const { min, max } = this.handleMinMaxValue(value);
        this.setState({ currentMin: min, currentMax: max });
      }
    }
  }

  handleMinMaxValue(value) {
    const { min: propMin, max: propMax } = this.props.filter || {
      min: 0,
      max: Infinity,
    };
    const [vMin, vMax] = value.split(":");
    return {
      min: vMin.trim() !== "" ? Number(vMin) : propMin,
      max: vMax.trim() !== "" ? Number(vMax) : propMax,
    };
  }

  render() {
    const { filter, editable, availableFilters } = this.props;
    console.log("FilterCard rendering", { filter });
    const filterAddSelection = () => (
      <>
        <span style={{ marginLeft: "12px" }}>Add filter for: </span>
        <select
          className="filter-selection"
          defaultValue="-1"
          onChange={({ target: { value: idx } }) => {
            if (idx === -1) {
              return;
            }
            this.setState({ idx, active: true });
            this.props.addFilter(idx);
          }}
        >
          <option value="-1" disabled>
            Column
          </option>
          {availableFilters.map(({ idx, display_title }) => (
            <option key={idx} value={idx}>
              {display_title}
            </option>
          ))}
        </select>
      </>
    );

    const makeHeader = (name, editable) => (
      <div className="filter-card--header">
        {editable ? (
          filterAddSelection()
        ) : (
          <>
            <h4 className="title">{filter.display_title}</h4>
            <FontAwesomeIcon
              className="delete-button"
              icon={faTimes}
              onClick={() => {
                this.props.removeFilter();
              }}
            />
          </>
        )}
      </div>
    );

    const makeFilterBody = (filter) => {
      if (!filter) {
        return null;
      }
      const {
        title,
        type,
        min,
        max,
        categories,
        statuses,
        values = [],
      } = filter;
      console.log({ values });
      let body;
      if (type === "status") {
        body = (
          <>
            <b>Category</b>
            <ul className="filter-card--body--list">
              {categories.map((category) => (
                <li key={category}>
                  <input
                    type="checkbox"
                    name={`cat-${category}`}
                    checked={values.includes(category)}
                    onChange={({ target: { checked } }) => {
                      console.log({ checked, category });
                      if (checked) {
                        const newValues = [...values, category];
                        this.setState({ values: newValues });
                        this.sendFilterUpdate(newValues);
                      } else {
                        const newValues = without(category, values);

                        this.setState({ values: newValues });
                        this.sendFilterUpdate(newValues);
                      }
                    }}
                  />
                  <label htmlFor={`cat-${category}`}>{category}</label>
                </li>
              ))}
            </ul>
            <b>Status</b>
            <ul className="filter-card--body--list">
              {statuses.map((status) => (
                <li key={status}>
                  <input
                    type="checkbox"
                    name={`stat-${status}`}
                    checked={values.includes(status)}
                    onChange={({ target: { checked } }) => {
                      console.log({ checked, status });
                      if (checked) {
                        const newValues = [...values, status];
                        this.setState({ values: newValues });
                        this.sendFilterUpdate(newValues);
                      } else {
                        const newValues = without(status, values);
                        console.log({ values, newValues });
                        this.setState({ values: newValues });
                        this.sendFilterUpdate(newValues);
                      }
                    }}
                  />
                  <label htmlFor={`stat-${status}`}>{status}</label>
                </li>
              ))}
            </ul>
          </>
        );
      } else if (type === "text") {
        const [value] = values;

        body = (
          <input
            type="text"
            name={`text-${title}`}
            placeholder="Search for value"
            value={value}
            onChange={({ target: { value: textValue } }) => {
              console.log({ textValue });
              clearTimeout(debounceHandler);
              this.setState({ values: [textValue] });
              debounceHandler = setTimeout(() => {
                this.sendFilterUpdate([textValue]);
              }, 500);
            }}
          />
        );
      } else {
        body = (
          <>
            <div className="filter-card--range-container">
              <b>{min}</b>
              <b>{max}</b>
            </div>
            <Range
              min={min}
              max={max}
              step={(max - min) / 1000.0}
              defaultValue={[min, max]}
              value={[this.state.currentMin, this.state.currentMax]}
              onChange={([nMin, nMax]) =>
                this.setState({ currentMin: nMin, currentMax: nMax })
              }
              onAfterChange={([nMin, nMax]) => {
                this.setState({
                  currentMin: nMin,
                  currentMax: nMax,
                  values: [`${nMin}:${nMax}`],
                });
                this.sendFilterUpdate([`${nMin}:${nMax}`]);
              }}
            />
            <div className="filter-card--range-input-fields">
              <label
                className="range-input-fields--min"
                htmlFor={`inp-${title}-min`}
              >
                minimum
              </label>
              <label
                className="range-input-fields--max"
                htmlFor={`inp-${title}-max`}
              >
                maximum
              </label>
              <input
                type="number"
                name={`inp-${title}-min`}
                value={this.state.currentMin}
                step={(max - min) / 1000.0}
                onChange={({ target: { value } }) => {
                  if (value > this.state.currentMax) {
                    this.setState({
                      currentMax: value,
                      currentMin: this.state.currentMax,
                      values: [`${this.state.currentMax}:${value}`],
                    });
                  } else {
                    this.setState({
                      currentmin: value,
                      values: [`${value}:${this.state.currentMax}`],
                    });
                  }
                }}
              />
              <input
                type="number"
                name={`inp-${title}-max`}
                step={(max - min) / 1000.0}
                value={this.state.currentMax}
                onChange={({ target: { value } }) => {
                  if (value < this.state.currentMin) {
                    this.setState({
                      currentMax: this.state.currentMin,
                      currentMin: value,
                      values: [`${value}:${this.state.currentMin}`],
                    });
                  } else {
                    this.setState({
                      currentMax: value,
                      values: [`${this.state.currentMin}:${value}`],
                    });
                  }
                }}
              />
            </div>
          </>
        );
      }
      return <div className="filter-card--body">{body}</div>;
    };

    return (
      <div className="filter-card">
        {makeHeader(this.props.name, editable)}
        {makeFilterBody(this.props.filter)}
      </div>
    );
  }
}
